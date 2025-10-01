import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ContractURIUpdated,
  ExtensionAdded,
  ExtensionRemoved,
  ExtensionReplaced,
  FlatPlatformFeeUpdated,
  FunctionDisabled,
  FunctionEnabled,
  Initialized,
  PlatformFeeInfoUpdated,
  PlatformFeeTypeUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  RoyaltyEngineUpdated
} from "../generated/MarketplaceV3/MarketplaceV3"

export function createContractURIUpdatedEvent(
  prevURI: string,
  newURI: string
): ContractURIUpdated {
  let contractUriUpdatedEvent = changetype<ContractURIUpdated>(newMockEvent())

  contractUriUpdatedEvent.parameters = new Array()

  contractUriUpdatedEvent.parameters.push(
    new ethereum.EventParam("prevURI", ethereum.Value.fromString(prevURI))
  )
  contractUriUpdatedEvent.parameters.push(
    new ethereum.EventParam("newURI", ethereum.Value.fromString(newURI))
  )

  return contractUriUpdatedEvent
}

export function createExtensionAddedEvent(
  name: string,
  implementation: Address,
  extension: ethereum.Tuple
): ExtensionAdded {
  let extensionAddedEvent = changetype<ExtensionAdded>(newMockEvent())

  extensionAddedEvent.parameters = new Array()

  extensionAddedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  extensionAddedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )
  extensionAddedEvent.parameters.push(
    new ethereum.EventParam("extension", ethereum.Value.fromTuple(extension))
  )

  return extensionAddedEvent
}

export function createExtensionRemovedEvent(
  name: string,
  extension: ethereum.Tuple
): ExtensionRemoved {
  let extensionRemovedEvent = changetype<ExtensionRemoved>(newMockEvent())

  extensionRemovedEvent.parameters = new Array()

  extensionRemovedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  extensionRemovedEvent.parameters.push(
    new ethereum.EventParam("extension", ethereum.Value.fromTuple(extension))
  )

  return extensionRemovedEvent
}

export function createExtensionReplacedEvent(
  name: string,
  implementation: Address,
  extension: ethereum.Tuple
): ExtensionReplaced {
  let extensionReplacedEvent = changetype<ExtensionReplaced>(newMockEvent())

  extensionReplacedEvent.parameters = new Array()

  extensionReplacedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  extensionReplacedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )
  extensionReplacedEvent.parameters.push(
    new ethereum.EventParam("extension", ethereum.Value.fromTuple(extension))
  )

  return extensionReplacedEvent
}

export function createFlatPlatformFeeUpdatedEvent(
  platformFeeRecipient: Address,
  flatFee: BigInt
): FlatPlatformFeeUpdated {
  let flatPlatformFeeUpdatedEvent =
    changetype<FlatPlatformFeeUpdated>(newMockEvent())

  flatPlatformFeeUpdatedEvent.parameters = new Array()

  flatPlatformFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "platformFeeRecipient",
      ethereum.Value.fromAddress(platformFeeRecipient)
    )
  )
  flatPlatformFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "flatFee",
      ethereum.Value.fromUnsignedBigInt(flatFee)
    )
  )

  return flatPlatformFeeUpdatedEvent
}

export function createFunctionDisabledEvent(
  name: string,
  functionSelector: Bytes,
  extMetadata: ethereum.Tuple
): FunctionDisabled {
  let functionDisabledEvent = changetype<FunctionDisabled>(newMockEvent())

  functionDisabledEvent.parameters = new Array()

  functionDisabledEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  functionDisabledEvent.parameters.push(
    new ethereum.EventParam(
      "functionSelector",
      ethereum.Value.fromFixedBytes(functionSelector)
    )
  )
  functionDisabledEvent.parameters.push(
    new ethereum.EventParam(
      "extMetadata",
      ethereum.Value.fromTuple(extMetadata)
    )
  )

  return functionDisabledEvent
}

export function createFunctionEnabledEvent(
  name: string,
  functionSelector: Bytes,
  extFunction: ethereum.Tuple,
  extMetadata: ethereum.Tuple
): FunctionEnabled {
  let functionEnabledEvent = changetype<FunctionEnabled>(newMockEvent())

  functionEnabledEvent.parameters = new Array()

  functionEnabledEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  functionEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "functionSelector",
      ethereum.Value.fromFixedBytes(functionSelector)
    )
  )
  functionEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "extFunction",
      ethereum.Value.fromTuple(extFunction)
    )
  )
  functionEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "extMetadata",
      ethereum.Value.fromTuple(extMetadata)
    )
  )

  return functionEnabledEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createPlatformFeeInfoUpdatedEvent(
  platformFeeRecipient: Address,
  platformFeeBps: BigInt
): PlatformFeeInfoUpdated {
  let platformFeeInfoUpdatedEvent =
    changetype<PlatformFeeInfoUpdated>(newMockEvent())

  platformFeeInfoUpdatedEvent.parameters = new Array()

  platformFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "platformFeeRecipient",
      ethereum.Value.fromAddress(platformFeeRecipient)
    )
  )
  platformFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "platformFeeBps",
      ethereum.Value.fromUnsignedBigInt(platformFeeBps)
    )
  )

  return platformFeeInfoUpdatedEvent
}

export function createPlatformFeeTypeUpdatedEvent(
  feeType: i32
): PlatformFeeTypeUpdated {
  let platformFeeTypeUpdatedEvent =
    changetype<PlatformFeeTypeUpdated>(newMockEvent())

  platformFeeTypeUpdatedEvent.parameters = new Array()

  platformFeeTypeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "feeType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(feeType))
    )
  )

  return platformFeeTypeUpdatedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createRoyaltyEngineUpdatedEvent(
  previousAddress: Address,
  newAddress: Address
): RoyaltyEngineUpdated {
  let royaltyEngineUpdatedEvent =
    changetype<RoyaltyEngineUpdated>(newMockEvent())

  royaltyEngineUpdatedEvent.parameters = new Array()

  royaltyEngineUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAddress",
      ethereum.Value.fromAddress(previousAddress)
    )
  )
  royaltyEngineUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return royaltyEngineUpdatedEvent
}
