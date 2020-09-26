FROM node:12

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
ENV NODE_ENV=production

COPY . .

CMD ["npm", "start"]