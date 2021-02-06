const Discord = require("discord.js");
var spawn = require("child_process").spawn;
const client = new Discord.Client();

DISCORD_CLIENT_TOKEN = process.env.DISCORD_CLIENT_TOKEN;
TIDAL_DL_PATH = process.env.TIDAL_DL_PATH;
TIDAL_OUTPUT_PATH = process.env.TIDAL_OUTPUT_PATH;
BEETS_CONFIG_FILE = process.env.BEETS_CONFIG_FILE;
BEETS_LIBRARY_FILE = process.env.BEETS_LIBRARY_FILE;
BEETS_LIBRARY_DIR = process.env.BEETS_LIBRARY_DIR;

// add config paths to our beets config file

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.author.bot) {
    return;
  }
  if (msg.content === "ping") {
    msg.reply("pong");
    return;
  }
  // var myRegexp = /listen.tidal.com\/[a-zA-Z0-9()]{1,6}\/([0-9]*)/g;
  var myRegexp = /.*tidal.com\/([a-zA-Z]{1,6})\/([0-9]*)/gm;
  console.log(msg.content);
  var match = myRegexp.exec(msg.content);
  if (!match) {
    console.log("match:", match);
    msg.reply("Sorry, i can only read Tidal URLs.");
    return;
  }
  if (match.length > 0) {
    var tidal_id = match[2];
    var resource_type = match[1];
    msg.reply("Found a Tidal ID: " + tidal_id);
    msg.reply("Trying to download " + resource_type + ", please wait...");
    var { successes, failures } = await download_with_progress(tidal_id, msg);
    // add_to_beets("/media/nfs/music/import/discord", msg);
  } else {
    msg.reply("Please send a Tidal URL!");
  }
});
// like from https://stackoverflow.com/questions/5775088/how-to-execute-an-external-program-from-within-node-js
const download_with_progress = async function (tidal_url, msg) {
  console.log("starting downloader...");
  console.log("using:", tidal_url);
  var prc = spawn(TIDAL_DL_PATH, [
    "-l",
    tidal_url,
    "--output",
    TIDAL_OUTPUT_PATH,
  ]);
  prc.stdout.setEncoding("utf8");
  parsed_results = [];
  var successes = [];
  var failures = [];
  var sent_success_msg = false;
  prc.stdout.on("data", function (data) {
    var str = data.toString();
    console.log(str);
    var lines = str.split(/(\r?\n)/g);
    // console.log(lines.join(""));
    if (lines.join("").includes("login code")) {
      msg.reply(
        "Login code reset. Go to link.tidal.com and enter in code below:\n" +
          lines.join("")
      );
    }
    if (lines.join("").includes("[ERR]")) {
      failures.push(lines);
    } else if (
      lines.join("").includes("[SUCCESS]") | lines.join("").includes("|")
    ) {
      successes.push(lines);
      if (!sent_success_msg) {
        sent_success_msg = true;
        msg.reply("Successfully downloading...");
      }
    }
  });
  prc.on("exit", function (data) {
    if (successes.join("").length > 2000) {
      msg.reply("Successfully downloaded!");
    }
    // msg.reply("Succeeded:\n" + successes.join(""));
    if (failures.length > 0) {
      msg.reply("Some tracks had errors, see below:\n" + failures.join(""));
    }
    if (failures.length < successes.length) {
      add_to_beets(TIDAL_OUTPUT_PATH, msg);
    }
  });
  return { failures, successes };
};

const add_to_beets = function (downloaded_path, msg) {
  console.log("starting importer...");
  msg.reply("Importing and renaming files...");
  var prc = spawn("beet", [
    "-c",
    BEETS_CONFIG_FILE,
    "-l",
    BEETS_LIBRARY_FILE,
    "-d",
    BEETS_LIBRARY_DIR,
    "import",
    "-i", // don't add things that have already been imported
    "-C", //move tracks, don't copy
    "-q", // don't ask for input
    TIDAL_OUTPUT_PATH,
  ]);

  prc.stdout.setEncoding("utf8");
  parsed_results = [];
  prc.stdout.on("data", function (data) {
    var str = data.toString();
    console.log(str);
    var lines = str.split(/(\r?\n)/g);
    parsed_results.push(lines.join(""));
  });
  prc.on("exit", function (data) {
    if (parsed_results.join("").length > 2000) {
      msg.reply("Successfully imported!");
    }

    console.log("exited:", data);
    msg.reply("Added to library. Stdout:\n" + parsed_results.join(""));
  });
};

client.login(DISCORD_CLIENT_TOKEN);
