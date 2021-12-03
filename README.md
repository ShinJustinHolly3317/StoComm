# StoComm

A platform where investors can share their insights to community via real-time voice chat and collaborative whiteboard tool.
Inspired by Tradingview and Stocktwits.

 * [Home page](https://stocomm.site/)
 * [Ideas Explore page](https://stocomm.site/explore)

## Test Account

 * Email: test@mail.com
 * Password: test

*Vistors are only for ideas posts reviewing, please log in to experience complete collaborative features!*ㄔㄛˉ

### One-Click Login
Type email and password automatically when sign in
 * [Fast-Login](https://stocomm.site/?testlogin)

 ---

<img src="./public/img/readme/stocomm-homepage.gif">

## Table of Contents
 * [Technologies](#Technologies)
 * [Architecture](#Architecture)
 * [Socket Flowchart](#Socket-Flowchart)
 * [Database Schema](#Database-Schema)
 * [Main Features](#Main-Features)
 * [Contact](#Contact)

## Architecture

<img src="./public/img/readme/architecture.png">

## Database Schema

<img src="./public/img/readme/db-schema.png">

## Features

 * ### Start a room to discuss or share insights

 <img src="./public/img/readme/start.gif">

 * ### Host can control drawing & voice permission 
   * ### Host View

   <img src="./public/img/readme/host-pert.gif">

   * ### Client View

   <img src="./public/img/readme/client-pert.gif">

 * ### Discuss topics with drawing tool

 <img src="./public/img/readme/draw.gif">

 * ### Post your idea to community

 <img src="./public/img/readme/post.gif">

## Technologies
### Back-End
 * **Runtime:** Node,js
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

## Contact

 * [LinkedIn](https://www.linkedin.com/in/hsin-ping-k/)
 * Email: slammingthebasket123@gmail.com