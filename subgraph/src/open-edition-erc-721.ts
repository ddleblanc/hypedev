import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  BatchMetadataUpdate as BatchMetadataUpdateEvent,
  ClaimConditionsUpdated as ClaimConditionsUpdatedEvent,
  ConsecutiveTransfer as ConsecutiveTransferEvent,
  ContractURIUpdated as ContractURIUpdatedEvent,
  DefaultRoyalty as DefaultRoyaltyEvent,
  Initialized as InitializedEvent,
  MetadataUpdate as MetadataUpdateEvent,
  OwnerUpdated as OwnerUpdatedEvent,
  PrimarySaleRecipientUpdated as PrimarySaleRecipientUpdatedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  RoyaltyForToken as RoyaltyForTokenEvent,
  SharedMetadataUpdated as SharedMetadataUpdatedEvent,
  TokensClaimed as TokensClaimedEvent,
  Transfer as TransferEvent,
} from "../generated/OpenEditionERC721/OpenEditionERC721"
import {
  Approval,
  ApprovalForAll,
  BatchMetadataUpdate,
  ClaimConditionsUpdated,
  ConsecutiveTransfer,
  ContractURIUpdated,
  DefaultRoyalty,
  Initialized,
  MetadataUpdate,
  OwnerUpdated,
  PrimarySaleRecipientUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  RoyaltyForToken,
  SharedMetadataUpdated,
  TokensClaimed,
  Transfer,
} from "../generated/schema"
import { Bytes } from "@graphprotocol/graph-ts"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBatchMetadataUpdate(
  event: BatchMetadataUpdateEvent,
): void {
  let entity = new BatchMetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity._fromTokenId = event.params._fromTokenId
  entity._toTokenId = event.params._toTokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleClaimConditionsUpdated(
  event: ClaimConditionsUpdatedEvent,
): void {
  let entity = new ClaimConditionsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.claimConditions = changetype<Bytes[]>(event.params.claimConditions)
  entity.resetEligibility = event.params.resetEligibility

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleConsecutiveTransfer(
  event: ConsecutiveTransferEvent,
): void {
  let entity = new ConsecutiveTransfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.fromTokenId = event.params.fromTokenId
  entity.toTokenId = event.params.toTokenId
  entity.from = event.params.from
  entity.to = event.params.to

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleContractURIUpdated(event: ContractURIUpdatedEvent): void {
  let entity = new ContractURIUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.prevURI = event.params.prevURI
  entity.newURI = event.params.newURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDefaultRoyalty(event: DefaultRoyaltyEvent): void {
  let entity = new DefaultRoyalty(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.newRoyaltyRecipient = event.params.newRoyaltyRecipient
  entity.newRoyaltyBps = event.params.newRoyaltyBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMetadataUpdate(event: MetadataUpdateEvent): void {
  let entity = new MetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity._tokenId = event.params._tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnerUpdated(event: OwnerUpdatedEvent): void {
  let entity = new OwnerUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.prevOwner = event.params.prevOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePrimarySaleRecipientUpdated(
  event: PrimarySaleRecipientUpdatedEvent,
): void {
  let entity = new PrimarySaleRecipientUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.recipient = event.params.recipient

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
    event.transaction.hash.concatI32(event.logIndex.toI32()),
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
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoyaltyForToken(event: RoyaltyForTokenEvent): void {
  let entity = new RoyaltyForToken(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.tokenId = event.params.tokenId
  entity.royaltyRecipient = event.params.royaltyRecipient
  entity.royaltyBps = event.params.royaltyBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSharedMetadataUpdated(
  event: SharedMetadataUpdatedEvent,
): void {
  let entity = new SharedMetadataUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.name = event.params.name
  entity.description = event.params.description
  entity.imageURI = event.params.imageURI
  entity.animationURI = event.params.animationURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokensClaimed(event: TokensClaimedEvent): void {
  let entity = new TokensClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.claimConditionIndex = event.params.claimConditionIndex
  entity.claimer = event.params.claimer
  entity.receiver = event.params.receiver
  entity.startTokenId = event.params.startTokenId
  entity.quantityClaimed = event.params.quantityClaimed

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
