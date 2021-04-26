import {
  BluetoothLE as ble,
  DescriptorParams,
  InitParams,
  OperationResult,
  ScanParams,
  ScanStatus,
  WriteCharacteristicParams,
} from "@nunosav/ionic-native-bluetooth-le";
import { reactive } from "vue";

export interface BluetoothState {
  enabled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isDiscovered: boolean;
  isDiscovering: boolean;
  isScanning: boolean;
  devices: ScanStatus[];
}

export const bluetoothState = reactive<BluetoothState>({
  enabled: false,
  isConnected: false,
  isConnecting: false,
  isDisconnecting: false,
  isDiscovered: false,
  isDiscovering: false,
  isScanning: false,
  devices: [],
});

export async function initialize(): Promise<void> {
  if (bluetoothState.enabled) return;

  await checkBLRequirements();

  const initParams: InitParams = {
    request: true,
    restoreKey: "somekey",
  };

  ble.initialize(initParams).subscribe(
    (res) => {
      const enabled = res.status === "enabled";
      bluetoothState.enabled = enabled;

      if (!enabled) console.log("disconnected");
    },
    (error) => {
      console.error(error);
    }
  );
}

async function checkBLRequirements(): Promise<void> {
  try {
    const { hasPermission } = await ble.hasPermission();
    const { isLocationEnabled } = await ble.isLocationEnabled();

    if (hasPermission === false) await ble.requestPermission();
    if (isLocationEnabled === false) await ble.requestLocation();

    return;
  } catch (error) {
    console.error(error);
  }
}

export function startScan(params: ScanParams = {}): void {
  if (bluetoothState.isScanning) return;

  ble.startScan(params).subscribe(
    (res) => {
      if (res.status === "scanStarted") bluetoothState.isScanning = true;

      if (res.status === "scanResult") bluetoothState.devices.push(res);
    },
    (error) => {
      console.error(error);
      bluetoothState.isScanning = false;
    }
  );
}

export async function connect(address: string): Promise<void> {
  if (!bluetoothState.enabled) throw new Error("BLE is off");
  if (bluetoothState.isConnecting || bluetoothState.isConnected) return;

  try {
    const connected = await isConnected(address);

    bluetoothState.isConnecting = !connected;

    if (connected) return;

    bluetoothState.isDiscovering = false;

    ble.connect({ address }).subscribe(
      ({ status }) => {
        const isConnected = status === "connected";
        bluetoothState.isConnected = isConnected;

        if (isConnected) discover(address);
        else console.log("disconnected");
      },
      (error) => {
        console.error(error);
      }
    );
  } catch (error) {
    console.error(error);
  }
}

async function isConnected(address: string) {
  try {
    const { isConnected } = await ble.isConnected({ address });
    bluetoothState.isConnected = isConnected;

    return isConnected;
  } catch {
    return false;
  }
}

async function discover(address: string) {
  if (bluetoothState.isDiscovering) return;

  try {
    const params = {
      address,
      clearCache: true,
    };

    bluetoothState.isDiscovering = true;

    const { status } = await ble.discover(params);

    bluetoothState.isDiscovering = false;

    if (status === "discovered") bluetoothState.isDiscovered = true;
  } catch (error) {
    bluetoothState.isDiscovering = false;
    bluetoothState.isDiscovered = false;
    console.error(error);
  }
}

export async function disconnect(address: string): Promise<void> {
  try {
    bluetoothState.isDisconnecting = true;

    await ble.disconnect({ address });

    await close(address);

    bluetoothState.isConnected = false;
  } catch {
    await close(address);
    bluetoothState.isConnected = false;
  }
}

async function close(address: string) {
  try {
    await ble.close({ address });
  } catch (error) {
    console.error(error);
  }
}

export async function read(
  params: DescriptorParams
): Promise<string | undefined> {
  if (!params.address)
    throw new Error("Bluetooth.Write Error: there is no address to write to");

  const { value } = await ble.read(params);

  return value;
}

export async function write(
  params: WriteCharacteristicParams
): Promise<OperationResult | undefined> {
  if (!params.address)
    throw new Error("Bluetooth.Write Error: there is no address to write to");
  if (!params.value)
    throw new Error("Bluetooth.Write Error: there is no value to write");

  return await ble.write(params);
}
