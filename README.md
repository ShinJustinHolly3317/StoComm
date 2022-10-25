# StoComm

A platform where investors can share their insights to community via real-time voice chat and collaborative whiteboard tool. <br/>
Inspired by Tradingview and Stocktwits.

 * [Home page](https://stocomm.site/)
 * [Ideas Explore page](https://stocomm.site/explore)

## How To Start App
1. install docker
2. go with `docker compose up`, it handles the database migrate.

## Test Account

 * Email: test@mail.com
 * Password: test

*Vistors are only for ideas posts reviewing. <br/>
Please log in to experience complete collaborative features!*

## One-Click Login
Quick fill out login form with demo email and password 

 * [Fast-Login](https://stocomm.site?is_demo=1)

 ---

## Home Page
<img src="./public/img/readme/stocomm-homepage.gif">

## Table of Contents
 * [Features](#Features)
 * [Technologies](#Technologies)
 * [Architecture](#Architecture)
 * [Socket Flowchart](#Socket-Flowchart)
 * [Database Schema](#Database-Schema)
 * [Main Features](#Main-Features)
 * [Contact](#Contact)

## Features

 * ### Start a room to discuss or share insights
   * #### Host can choose a stock as a topic by entering a company name or stock code
   * #### Host can add multiple analytic charts to the whiteboard
   * #### Clients can share or discuss ideas with room member related to the topic after joining a room

 <img src="./public/img/readme/start.gif">

 * ### Drawing & Voice permission Control
   * ### Host View
     * #### Hosts can control below permissions when a focused environment is needed
       * #### Client's drawing permission
       * #### Client's voice permission


   <img src="./public/img/readme/host-pert.gif">

   * ### Client View
     * #### The drawing tool is hidden when Host turn off drawing permission
     * #### The voice connection is closed when Host mutes all clients, which remains only one-way broadcast

   <img src="./public/img/readme/client-pert.gif">

 * ### Discuss topics with real-time collaborative drawing tool

 <img src="./public/img/readme/draw.gif">

 * ### Post your idea to community

 <img src="./public/img/readme/post.gif">

---

## Architecture

<img src="./public/img/readme/architecture.png">

---

## Database Schema 

<img src="./public/img/readme/db-schema.png">

---

## Technologies
### Back-End
 * **Runtime:** Node.js
 * **Framework:** Express
 * **Server OS:** Linux
 * **Server-side Render:** Handlebars

### Front-End
 * **Framework:** Bootstrap
 * **Chart Library:** Anycahrt
 * **Drawing Library:** Konva

### WebSocket
 * Socket.IO

### WebRTC
 * PeerJS

### Cloud Service (AWS)
 * EC2
 * S3 + CloudFront
 * RDS

### Database
 * MySQL
 * Redis

### Networking 
 * Nginx

### Test
 * Jest
 * Supertest

### Others 
 * Design Pattern: MVC
 * Linter: Prettier

## Contact

 * [LinkedIn](https://www.linkedin.com/in/hsin-ping-k/)
 * Email: slammingthebasket123@gmail.com