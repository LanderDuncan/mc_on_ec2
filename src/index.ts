import {
  EC2Client,
  RunInstancesCommand,
  type _InstanceType,
  AllocateAddressCommand,
  AssociateAddressCommand,
  waitUntilInstanceStatusOk,
  StopInstancesCommand,
  StartInstancesCommand,
  TerminateInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  ReleaseAddressCommand,
  DescribeAddressesCommand,
  RebootInstancesCommand,
  waitUntilInstanceStopped,
} from "@aws-sdk/client-ec2";
import { type server } from "./interfaces/index.interfaces.js";
const REGION = "us-west-2";
const client = new EC2Client({ region: REGION });

/**
 * Function to launch an EC2 instance that is running a Minecraft server. It can be accessed through the returned IP address.
 *
 * @param playerCount represents the size of the server. Must be at least one.
 * @returns A Promise that resolves to a result conforming to the server interface. The promise will be rejected if an AWS call fails.
 */
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
    client
      .send(createSecurityGroupCommand)
      .then(async (result) => {
        sgroupID = result.GroupId ?? "";
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
      .catch(() => {})
      .then(async () => {
        const createCommand = new RunInstancesCommand({
          SecurityGroups: ["Minecraft"],
          ImageId: "ami-0ae49954dfb447966",
          InstanceType,
          MinCount: 1,
          MaxCount: 1,
          UserData:
            "IyEvYmluL2Jhc2gKc3VkbyB5dW0gaW5zdGFsbCBqYXZhLTE3LWFtYXpvbi1jb3JyZXR0by1oZWFkbGVzcyAteQp3Z2V0IGh0dHBzOi8vcGlzdG9uLWRhdGEubW9qYW5nLmNvbS92MS9vYmplY3RzLzhkZDFhMjgwMTVmNTFiMTgwMzIxMzg5MmI1MGI3YjRmYzc2ZTU5NGQvc2VydmVyLmphcgpqYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3VpCnNlZCAnMyBjXCBldWxhPXRydWUnIGV1bGEudHh0IC1pCmVjaG8gLWUgJyMhL2Jpbi9iYXNoXG5qYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3VpJyB8IHN1ZG8gdGVlIC9ldGMvcmMuZC9yYy5sb2NhbCA+IC9kZXYvbnVsbApzdWRvIGNobW9kICt4IC9ldGMvcmMuZC9yYy5sb2NhbApqYXZhIC1YbXgxMDI0TSAtWG1zMTAyNE0gLWphciBzZXJ2ZXIuamFyIG5vZ3Vp",
        });
        return client.send(createCommand);
      })
      .then(async (result) => {
        instanceID = result.Instances?.[0]?.InstanceId ?? "";
        return waitUntilInstanceStatusOk(
          {
            client,
            maxWaitTime: 1000,
          },
          { InstanceIds: [instanceID] }
        );
      })
      .then(async () => {
        const allocateCommand = new AllocateAddressCommand({});
        return client.send(allocateCommand);
      })
      .then(async (result) => {
        const associateCommand = new AssociateAddressCommand({
          AllocationId: result.AllocationId ?? "",
          InstanceId: instanceID,
        });
        instanceIP = result.PublicIp ?? "";
        return client.send(associateCommand);
      })
      .then(() => {
        resolve({ id: instanceID, ip: instanceIP });
      })
      .catch((err) => {
        reject(err);
      });
  });
  return await serverPromise;
};

/**
 * Function to stop a specified EC2 instance
 *
 * @param instanceID string representing a valid AWS EC2 instance.
 */
export const stopServer = async (instanceID: string): Promise<void> => {
  const serverPromise = new Promise<void>((resolve, reject) => {
    const stopCommand = new StopInstancesCommand({
      InstanceIds: [instanceID],
    });
    client
      .send(stopCommand)
      .then(async () => {
        return waitUntilInstanceStopped(
          {
            client,
            maxWaitTime: 1000,
          },
          { InstanceIds: [instanceID] }
        );
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
  await serverPromise;
};

/**
 * Function to start a specified EC2 instance that is in the stopped state.
 *
 * @param instanceID string representing a valid AWS EC2 instance.
 */
export const startServer = async (instanceID: string): Promise<void> => {
  const serverPromise = new Promise<void>((resolve, reject) => {
    const startCommand = new StartInstancesCommand({
      InstanceIds: [instanceID],
    });
    client
      .send(startCommand)
      .then(async () => {
        return waitUntilInstanceStatusOk(
          {
            client,
            maxWaitTime: 1000,
          },
          { InstanceIds: [instanceID] }
        );
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
  await serverPromise;
};

/**
 * Function to reboot an EC2 instance to resolve issues with the underlying operating system or server functionality.
 *
 * @param instanceID string representing a valid AWS EC2 instance.
 */
export const rebootServer = async (instanceID: string): Promise<void> => {
  const serverPromise = new Promise<void>((resolve, reject) => {
    const rebootCommand = new RebootInstancesCommand({
      InstanceIds: [instanceID],
    });

    client
      .send(rebootCommand)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

  await serverPromise;
};

/**
 * Function to terminate the selected EC2 instance and release its associated elastic IP address.
 *
 * @param instanceID string representing a valid AWS EC2 instance.
 */
export const terminateServer = async (instanceID: string): Promise<void> => {
  const serverPromise = new Promise<void>((resolve, reject) => {
    let allocationID = "";
    const DescAddressesCommand = new DescribeAddressesCommand({});

    client
      .send(DescAddressesCommand)
      .then(async (result) => {
        result.Addresses?.forEach((ele) => {
          if (ele.InstanceId === instanceID) {
            allocationID = ele.AllocationId ?? "";
          }
        });

        const releaseIPCommand = new ReleaseAddressCommand({
          AllocationId: allocationID,
        });

        return client.send(releaseIPCommand);
      })
      .then(async () => {
        const terminateCommand = new TerminateInstancesCommand({
          InstanceIds: [instanceID],
        });
        return client.send(terminateCommand);
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
  await serverPromise;
};
