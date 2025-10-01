import {
  ContractURIUpdated as ContractURIUpdatedEvent,
  ExtensionAdded as ExtensionAddedEvent,
  ExtensionRemoved as ExtensionRemovedEvent,
  ExtensionReplaced as ExtensionReplacedEvent,
  FlatPlatformFeeUpdated as FlatPlatformFeeUpdatedEvent,
  FunctionDisabled as FunctionDisabledEvent,
  FunctionEnabled as FunctionEnabledEvent,
  Initialized as InitializedEvent,
  PlatformFeeInfoUpdated as PlatformFeeInfoUpdatedEvent,
  PlatformFeeTypeUpdated as PlatformFeeTypeUpdatedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  RoyaltyEngineUpdated as RoyaltyEngineUpdatedEvent
} from "../generated/MarketplaceV3/MarketplaceV3"
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
} from "../generated/schema"
import { Bytes } from "@graphprotocol/graph-ts"

export function handleContractURIUpdated(event: ContractURIUpdatedEvent): void {
  let entity = new ContractURIUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.prevURI = event.params.prevURI
  entity.newURI = event.params.newURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleExtensionAdded(event: ExtensionAddedEvent): void {
  let entity = new ExtensionAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.name = event.params.name.toString()
  entity.implementation = event.params.implementation
  entity.extension_metadata_name = event.params.extension.metadata.name
  entity.extension_metadata_metadataURI =
    event.params.extension.metadata.metadataURI
  entity.extension_metadata_implementation =
    event.params.extension.metadata.implementation
  entity.extension_functions = changetype<Bytes[]>(
    event.params.extension.functions
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleExtensionRemoved(event: ExtensionRemovedEvent): void {
  let entity = new ExtensionRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.name = event.params.name.toString()
  entity.extension_metadata_name = event.params.extension.metadata.name
  entity.extension_metadata_metadataURI =
    event.params.extension.metadata.metadataURI
  entity.extension_metadata_implementation =
    event.params.extension.metadata.implementation
  entity.extension_functions = changetype<Bytes[]>(
    event.params.extension.functions
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleExtensionReplaced(event: ExtensionReplacedEvent): void {
  let entity = new ExtensionReplaced(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.name = event.params.name.toString()
  entity.implementation = event.params.implementation
  entity.extension_metadata_name = event.params.extension.metadata.name
  entity.extension_metadata_metadataURI =
    event.params.extension.metadata.metadataURI
  entity.extension_metadata_implementation =
    event.params.extension.metadata.implementation
  entity.extension_functions = changetype<Bytes[]>(
    event.params.extension.functions
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFlatPlatformFeeUpdated(
  event: FlatPlatformFeeUpdatedEvent
): void {
  let entity = new FlatPlatformFeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.platformFeeRecipient = event.params.platformFeeRecipient
  entity.flatFee = event.params.flatFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFunctionDisabled(event: FunctionDisabledEvent): void {
  let entity = new FunctionDisabled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.name = event.params.name.toString()
  entity.functionSelector = event.params.functionSelector
  entity.extMetadata_name = event.params.extMetadata.name
  entity.extMetadata_metadataURI = event.params.extMetadata.metadataURI
  entity.extMetadata_implementation = event.params.extMetadata.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFunctionEnabled(event: FunctionEnabledEvent): void {
  let entity = new FunctionEnabled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.name = event.params.name.toString()
  entity.functionSelector = event.params.functionSelector
  entity.extFunction_functionSelector =
    event.params.extFunction.functionSelector
  entity.extFunction_functionSignature =
    event.params.extFunction.functionSignature
  entity.extMetadata_name = event.params.extMetadata.name
  entity.extMetadata_metadataURI = event.params.extMetadata.metadataURI
  entity.extMetadata_implementation = event.params.extMetadata.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePlatformFeeInfoUpdated(
  event: PlatformFeeInfoUpdatedEvent
): void {
  let entity = new PlatformFeeInfoUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.platformFeeRecipient = event.params.platformFeeRecipient
  entity.platformFeeBps = event.params.platformFeeBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePlatformFeeTypeUpdated(
  event: PlatformFeeTypeUpdatedEvent
): void {
  let entity = new PlatformFeeTypeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.feeType = event.params.feeType

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoyaltyEngineUpdated(
  event: RoyaltyEngineUpdatedEvent
): void {
  let entity = new RoyaltyEngineUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousAddress = event.params.previousAddress
  entity.newAddress = event.params.newAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
