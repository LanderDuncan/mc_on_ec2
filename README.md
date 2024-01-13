# mc_on_ec2

## Overview
mc_on_ec2 is a promise-based wrapper for the AWS V3 Javascript SDK that makes it easy to manage Minecraft servers. This module was written in typescript and includes a bash script to configure the Minecraft server and restart it when the instance boots.
### Features
API includes functions that allow you to:
* [Launch](#launching)
* [Stop](#stop)
* [Start](#start)
* [Reboot](#reboot)
* [Terminate](#terminate)

A 1.20.4 Minecraft server will be running at all times when the instance is functional and the game state will be preserved across instance restarts.
## Usage
To install through NPM, run the following command:
```Typescript
npm i mc_on_ec2
```
To use this package you must be authenticated with AWS. Follow [this link](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) for the latest best practices.
## API
### Launch
```Typescript
createServer(playerCount: number): Promise<server>
```
This function will create an EC2 instance running a version 1.20.4 Minecraft server. Networking security policies will be correctly configured and an elastic IP will be created to persist the IP address across instance restarts.
### Input
**playerCount:** a number greater than 1 that indicates the maximum expected player count. This will determine the EC2 instance type to launch as follows:

$$\begin{align*}
1 < & \text{ playerCount} < 10 &&= \text{c6i.large}\\
10 \leq & \text{ playerCount} < 20 &&= \text{c6i.xlarge}\\
20 \leq & \text{ playerCount} &&= \text{c6i.2xlarge}\\
\end{align*}$$ 

### Output
**Promise\<server>:** This promise will conform to the [server](#server) interface. It will resolve once the server is fully functional. It will be rejected if there are any errors with the AWS call.
### Example
```Typescript
import { createServer } from "mc_on_ec2";

createServer(5)
.then((result)=>console.log(result)) // {id: "i-example", ip: "1.1.1.1"}
.catch((error)=> console.log(error)); // May be rejected if the user has not completed AWS authentication procedures.
```

### Stop
```Typescript
stopServer(instanceID: string): Promise<void>
```
This function will stop the specified server. This will preserve the play-state of the game for all players while minimizing the hosting cost when the server is not in use.
### Input
**instanceID:** A valid EC2 instance ID. Intended to be used in tandem with the output of the createServer function.
### Output
**Promise\<void>:** This promise will resolve once AWS has received the stop command. This promise will be rejected if there are any errors with the AWS call.
### Example
```Typescript
import { stopServer } from "mc_on_ec2";

stopServer("i-example")
.catch((error)=> console.log(error)); // May be rejected if the user has not followed AWS authentication procedures.
```

### Start
```Typescript
startServer(instanceID: string): Promise<void>
```
This function will start the specified server. This is intended to be used after the stopServer function in order to resume server functionality.
### Input
**instanceID:** A valid EC2 instance ID. Intended to be used in tandem with the output of the createServer function.
### Output
**Promise\<void>:** This promise will resolve once the server is fully functional. This promise will be rejected if there are any errors with the AWS call.
### Example
```Typescript
import { startServer } from "mc_on_ec2";

startServer("i-example")
.catch((error)=> console.log(error)); // May be rejected if the user has not followed AWS authentication procedures.
```

### Reboot
```Typescript
rebootServer(instanceID: string): Promise<void>
```
This function will restart the specified EC2 instance in case of issues with the operating system or Minecraft server.
### Input
**instanceID:** A valid EC2 instance ID. Intended to be used in tandem with the output of the createServer function.
### Output
**Promise\<void>:** This promise will resolve once the server is fully functional. This promise will be rejected if there are any errors with the AWS call.
### Example
```Typescript
import { rebootServer } from "mc_on_ec2";

rebootServer("i-example")
.catch((error)=> console.log(error)); // May be rejected if the user has not followed AWS authentication procedures.
```

### Terminate
```Typescript
terminateServer(instanceID: string): Promise<void>
```
This function will terminate the specified EC2 instance and associated elastic IP.
<br>
**Warning:** This is not reversible and the game state will be lost.
<br>
**Warning:** This will terminate both the instance and the elastic IP. Use carefully when deleting servers not generated using this module.

### Input
**instanceID:** A valid EC2 instance ID. Intended to be used in tandem with the output of the createServer function.
### Output
**Promise\<void>:** This promise will resolve once AWS has received the termination command. This promise will be rejected if there are any errors with the AWS call.
### Example
```Typescript
import { terminateServer } from "mc_on_ec2";

terminateServer("i-example")
.catch((error)=> console.log(error)); // May be rejected if the user has not followed AWS authentication procedures.
```
## Types
### server
```Typescript
interface server {
    'id': string,
    'ip': string;
}
```
The id declaration represents the AWS EC2 instance ID. The ip declaration represents the elastic IP associated with the instance.
## License
[MIT](https://github.com/LanderDuncan/mc_on_ec2/blob/main/LICENSE)