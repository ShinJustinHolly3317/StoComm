FROM node:16-alpine

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY  . .
EXPOSE 3000

CMD [ "sh", "-c", "node --unhandled-rejections=warn app.js" ]