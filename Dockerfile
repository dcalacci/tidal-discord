FROM nikolaik/python-nodejs:python3.7-nodejs15

COPY . /app
WORKDIR /app
RUN pip install --upgrade pip
RUN pip install tidal-dl beets --upgrade
RUN npm install
# copy tidal-dl config 
COPY config/.tidal-dl.json /root/.tidal-dl.json

# RUN envsubst < config/config.template > config/config.yaml

ENTRYPOINT ["node"]
CMD ["bot.js"]
