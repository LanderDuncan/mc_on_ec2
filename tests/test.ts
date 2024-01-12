import {createServer,startServer,stopServer,terminateServer,rebootServer} from '../src';

async function main() {
    // const x= await createServer(1);
    // console.log(x);
    // await stopServer("");
    // await startServer("");
    // await rebootServer("")
    
    await terminateServer("");
    console.log("Done.")
}

main();