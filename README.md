# CPU Monitoring app

## About

This app displays the average cpu load over a time window (set to 10 minutes but editable in server/config.js) as a line graph.

* It alerts the user everytime the CPU average load goes into high load average by updating the tile of the page and (if enabled) by playing an alert sound.
* It will display the high load and recovery periods 

CPU informations (cpu load at a given time, number of high load/recoveries incidents, config) are provided by a back application in /server. New informations are fetched from it by the front application every 10 seconds.

The front application is in /src. It's being compiled by webpack into dist/.

## Installation

This app requires node 12.13.0 or higher.

In order to launch the app enter the following command : 

```shell script
$ sh start.sh
```

The required dependencies for both front and back are gonna be installed, the front application is gonna be built, and a served by a server running on port 8080. If this port is already in use on your machine you can change it in server/config.js. 

Once the server is launched, the front app is available at http://localhost:8080/.

If any change is made to the server/config.js file, the start script must be run again.

If you want to update the front app without relaunching the back app enter the following command :

```shell script
$ npx webpack
```


