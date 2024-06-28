FROM --platform=amd64 node:20-alpine

WORKDIR /usr/src/app
COPY package.json ./
# RUN sudo apt install chromium & sudo apt install chromium-browser
RUN npm install
COPY  . .
EXPOSE 3000

CMD [ "sh", "-c", "node --unhandled-rejections=warn app.js" ]