import {createServer,startServer,stopServer,terminateServer} from '../src/index';

async function main() {
    // const x= await createServer(1);
    // console.log(x);
    // await stopServer(x?.id);
    
    await terminateServer("i-05ea24e9cca6e2c87");
    console.log("Done.")
}

main();