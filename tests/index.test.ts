// import {createServer,startServer,stopServer,terminateServer,rebootServer} from '../src';

// async function main() {
//     // const x= await createServer(1);
//     // console.log(x);
//     // await stopServer("i-00a1e8b0883f771c9");
//     // await startServer("i-00a1e8b0883f771c9");
//     // await rebootServer("i-00a1e8b0883f771c9")
    
//     await terminateServer("i-00a1e8b0883f771c9");
//     console.log("Done.")
// }

// main();

import { stopServer } from '../src/index';

stopServer("i-055436dd2e0938fcc")
.catch((error)=> console.log(error)); // May reject if the user has not followed AWS authentication