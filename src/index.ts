import { EC2Client, RunInstancesCommand, _InstanceType, AllocateAddressCommand, AssociateAddressCommand, waitUntilInstanceStatusOk, StopInstancesCommand, StartInstancesCommand, TerminateInstancesCommand, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, ReleaseAddressCommand, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
const REGION = "us-west-2";
const client = new EC2Client({ region: REGION });

import { server } from './interfaces/index.interfaces';

import dotenv from 'dotenv' // TODO: remove
dotenv.config()


// Create server function
export const createServer = async (playerCount: number): Promise<server> => {

  if (playerCount < 1) {
    throw new RangeError("Player count must be at least 1.");
  }

  let instanceID: string;
  let instanceIP: string;
  let InstanceType: _InstanceType;
  let sgroupID: string;

  const serverPromise = new Promise<server>((resolve, reject) => {

    if (playerCount < 10) {
      InstanceType = "c6i.large";
    } else if (playerCount < 20) {
      InstanceType = "c6i.xlarge";
    } else {
      InstanceType = "c6i.2xlarge";
    }

    const createSecurityGroupCommand = new CreateSecurityGroupCommand({
      GroupName: "Minecraft",
      Description: "SG that alligns with MC server network policies.",
    });
    client.send(createSecurityGroupCommand).then((result) => {
      sgroupID = result.GroupId || '';
      const ingressCommand = new AuthorizeSecurityGroupIngressCommand({
        GroupId: sgroupID,
        IpPermissions: [
          {
            IpProtocol: "tcp",
            FromPort: 25565,
            ToPort: 25565,
            IpRanges: [{ CidrIp: "0.0.0.0/0" }],
          },
        ],
      });
      return client.send(ingressCommand);
    })
      .catch(() => { return; })
      .then(() => {
        const createCommand = new RunInstancesCommand({
          SecurityGroups: ["Minecraft"],
          ImageId: "ami-0ae49954dfb447966",
          InstanceType,
          MinCount: 1,
          MaxCount: 1,
          UserData: "IyEvYmluL2Jhc2gKc3VkbyB5dW0gaW5zdGFsbCBqYXZhLTE3LWFtYXpvbi1jb3JyZXR0by1oZWFkbGVzcyAteQp3Z2V0IGh0dHBzOi8vcGlzdG9uLWRhdGEubW9qYW5nLmNvbS92MS9vYmplY3RzLzhkZDFhMjgwMTVmNTFiMTgwMzIxMzg5MmI1MGI3YjRmYzc2ZTU5NGQvc2VydmVyLmphcgpqYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3VpCnNlZCAnMyBjXCBldWxhPXRydWUnIGV1bGEudHh0IC1pCmVjaG8gLWUgJyMhL2Jpbi9iYXNoXG5qYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3VpJyB8IHN1ZG8gdGVlIC9ldGMvcmMuZC9yYy5sb2NhbCA+IC9kZXYvbnVsbApzdWRvIGNobW9kICt4IC9ldGMvcmMuZC9yYy5sb2NhbApqYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3Vp"
        });
        return client.send(createCommand);
      })
      .then((result) => {
        instanceID = result.Instances?.[0]?.InstanceId || ''
        return waitUntilInstanceStatusOk(
          {
            client: client,
            maxWaitTime: 1000
          },
          { InstanceIds: [instanceID] },
        );
      })
      .then(() => {
        const allocateCommand = new AllocateAddressCommand({});
        return client.send(allocateCommand);
      })
      .then((result) => {
        const associateCommand = new AssociateAddressCommand({
          AllocationId: result.AllocationId || '',
          InstanceId: instanceID,
        });
        instanceIP = result.PublicIp || '';
        return client.send(associateCommand);
      })
      .then(() => {
        resolve({ id: instanceID, ip: instanceIP })
      })
      .catch((err) => reject(err));
  });
  return serverPromise;
};


export const stopServer = async (instanceId: string): Promise<void> => {
  const serverPromise = new Promise<void>((resolve, reject) => {
    const stopCommand = new StopInstancesCommand({
      InstanceIds: [instanceId],
    });
    client.send(stopCommand)
      .then(() => resolve())
      .catch((err) => reject(err));
  });
  return serverPromise;
}


export const startServer = (instanceId: string): Promise<void> => {
  const serverPromise = new Promise<void>((resolve, reject) => {
    const startCommand = new StartInstancesCommand({
      InstanceIds: [instanceId],
    });
    client.send(startCommand)
      .then(() => {
        return waitUntilInstanceStatusOk(
          {
            client: client,
            maxWaitTime: 1000
          },
          { InstanceIds: [instanceId] },
        );
      })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
  return serverPromise;
}

// TODO: Switch to actual API endpoint
export const rebootServer = async (instanceId: string) => {

  const serverPromise = new Promise<void>((resolve, reject) => {
    stopServer(instanceId)
      .then(() => { return startServer(instanceId) })
      .then(() => resolve())
      .catch((err) => reject(err));
  })

  return serverPromise;
}


export const terminateServer = async (instanceId: string) => {
  const serverPromise = new Promise<void>((resolve, reject) => {

    let allocationID = '';
    const DescAddressesCommand = new DescribeAddressesCommand({});

    // Get the allocation ID
    client.send(DescAddressesCommand)
      .then((result) => {
        result.Addresses?.forEach((ele) => {
          if (ele.InstanceId == instanceId) {
            allocationID = ele.AllocationId || '';
          }
        })
        // Release elastic IP
        const releaseIPCommand = new ReleaseAddressCommand({
          AllocationId: allocationID,
        });
    
        return client.send(releaseIPCommand);
      })
      .then(() => {
        // Terminate Instance
        const terminateCommand = new TerminateInstancesCommand({
          InstanceIds: [instanceId],
        });
        return client.send(terminateCommand);
      })
      .then(() => resolve()).catch((err) => reject(err))
  })
  return serverPromise;
};