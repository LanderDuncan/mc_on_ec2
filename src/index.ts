import { EC2Client, RunInstancesCommand, _InstanceType, AllocateAddressCommand, AssociateAddressCommand, waitUntilInstanceStatusOk, StopInstancesCommand, StartInstancesCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
const REGION = "us-west-2";
const client = new EC2Client({ region: REGION });

import { server } from './interfaces/index.interfaces';

import dotenv from 'dotenv'
dotenv.config()



// Create server function
export const createServer = async (playerCount: number): Promise<server> => {
  let instanceID: string;
  let instanceIP: string;
  let InstanceType: _InstanceType;
  let savedAllocationID: string;

  InstanceType = "c5.large";
  // if (playerCount < 10) {
  //   InstanceType = "c7g.medium";
  // } else if (playerCount < 15) {
  //   InstanceType = "c7g.large";
  // } else {
  //   InstanceType = "c7g.xlarge";
  // }

  const serverPromise = new Promise<server>(async (resolve, reject) => {
    // Launch server
    const createCommand = new RunInstancesCommand({
      //TODO: Don't hard-code security groups
      SecurityGroupIds: ["sg-019c724420048c0cd"],
      ImageId: "ami-0ae49954dfb447966",
      InstanceType,
      MinCount: 1,
      MaxCount: 1,
      UserData: "IyEvYmluL2Jhc2gKc3VkbyB5dW0gaW5zdGFsbCBqYXZhLTE3LWFtYXpvbi1jb3JyZXR0by1oZWFkbGVzcyAteQp3Z2V0IGh0dHBzOi8vcGlzdG9uLWRhdGEubW9qYW5nLmNvbS92MS9vYmplY3RzLzhkZDFhMjgwMTVmNTFiMTgwMzIxMzg5MmI1MGI3YjRmYzc2ZTU5NGQvc2VydmVyLmphcgpqYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3VpCnNlZCAnMyBjXCBldWxhPXRydWUnIGV1bGEudHh0IC1pCmVjaG8gLWUgJyMhL2Jpbi9iYXNoXG5qYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3VpJyB8IHN1ZG8gdGVlIC9ldGMvcmMuZC9yYy5sb2NhbCA+IC9kZXYvbnVsbApzdWRvIGNobW9kICt4IC9ldGMvcmMuZC9yYy5sb2NhbApqYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3Vp"
    });

    try {
      const response = await client.send(createCommand);
      console.log(response);
      instanceID = response.Instances?.[0]?.InstanceId || ''
      if (instanceID == '') {
        reject("AWS returned an incorect value.")
      }
      console.log()
    } catch (err) {
      console.error(err);
      reject("AWS call failed.")
    }

    // Wait for EC2 instance before allocating
    await waitUntilInstanceStatusOk(
      {
        client: client,
        maxWaitTime: 300 // 5 minutes
      },
      { InstanceIds: [instanceID] },
    );

    // Allocate IP Address
    const allocateCommand = new AllocateAddressCommand({});

    try {
      const { AllocationId, PublicIp } = await client.send(allocateCommand);
      instanceIP = PublicIp || '';
      savedAllocationID = AllocationId || '';
      if (instanceIP == '' || savedAllocationID == '') {
        reject("AWS returned an incorrect value.")
      }
    } catch (err) {
      console.error(err);
      reject("AWS call failed.");
    }
    // Associate IP Address
    const allocationId = savedAllocationID;
    const command = new AssociateAddressCommand({
      AllocationId: allocationId,
      InstanceId: instanceID,
    });

    try {
      await client.send(command);
    } catch (err) {
      console.error(err);
      reject("AWS call failed.");
    }
    // Function return
    resolve({ id: instanceID, ip: instanceIP })
  });
  return serverPromise;
};



export const stopServer = async (InstanceIds): Promise<void> => {
  const serverPromise = new Promise<void>(async (resolve, reject) => {
    const command = new StopInstancesCommand({
      // Use DescribeInstancesCommand to find InstanceIds
      InstanceIds: ["INSTANCE_ID"],
    });

    try {
      const { StoppingInstances } = await client.send(command);
      const instanceIdList = StoppingInstances?.map(
        (instance) => ` • ${instance.InstanceId}`,
      );
      console.log("Stopping instances:");
      console.log(instanceIdList?.join("\n"));
    } catch (err) {
      console.error(err);
    }
  });
  return serverPromise;
}



export const startServer = (InstanceIds): Promise<void> => {
  const serverPromise = new Promise<void>(async (resolve, reject) => {
    const command = new StartInstancesCommand({
      // Use DescribeInstancesCommand to find InstanceIds
      InstanceIds: ["INSTANCE_ID"],
    });

    try {
      const { StartingInstances } = await client.send(command);
      const instanceIdList = StartingInstances?.map(
        (instance) => ` • ${instance.InstanceId}`,
      );
      console.log("Starting instances:");
      console.log(instanceIdList?.join("\n"));
    } catch (err) {
      console.error(err);
    }
  })
  return serverPromise;
}



export const rebootServer = async (InstanceIds) => {

  const serverPromise = new Promise<void>(async (resolve, reject) => {
    await stopServer(InstanceIds);
    await startServer(InstanceIds);
  })

  return serverPromise;
}

export const terminateServer = async (InstanceIds) => {
  const serverPromise = new Promise<void>(async (resolve, reject) => {
    // Terminate server
    const command = new TerminateInstancesCommand({
      InstanceIds: ["INSTANCE_ID"],
    });

    try {
      const { TerminatingInstances } = await client.send(command);
      const instanceList = TerminatingInstances?.map(
        (instance) => ` • ${instance.InstanceId}`,
      );
      console.log("Terminating instances:");
      console.log(instanceList?.join("\n"));
    } catch (err) {
      console.error(err);
    }
  })

  return serverPromise;
}



//TODO: Add some lookup function