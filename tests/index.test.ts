import {
  createServer,
  startServer,
  stopServer,
  terminateServer,
  rebootServer,
} from "../src/index";
const SECONDS = 10000;
jest.setTimeout(1000 * SECONDS);

test("All operations on smallest server", async () => {
  const x = await createServer(1);
  expect(x.id).toMatch(/i-[a-zA-Z0-9]{17}/);
  expect(x.ip).toMatch(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/);
  await rebootServer(x.id);
  await stopServer(x.id);
  await startServer(x.id);
  await terminateServer(x.id);
});
