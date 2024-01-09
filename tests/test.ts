import {createServer} from './index_V3';

async function main() {
    const x= await createServer(1);
    console.log(x);
}

main();