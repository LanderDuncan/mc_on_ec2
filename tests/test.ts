import {createServer,startServer,stopServer,terminateServer} from '../src/index';

async function main() {
    // const x= await createServer(1);
    // console.log(x);
    // await stopServer(x?.id);
    
    await terminateServer("i-0761ca5ba5293b444");
    console.log("Done.")
}

main();