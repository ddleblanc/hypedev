import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
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
  Transfer
} from "../generated/OpenEditionERC721/OpenEditionERC721"

export function createApprovalEvent(
  owner: Address,
  approved: Address,
  tokenId: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromAddress(approved))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return approvalEvent
}

export function createApprovalForAllEvent(
  owner: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createBatchMetadataUpdateEvent(
  _fromTokenId: BigInt,
  _toTokenId: BigInt
): BatchMetadataUpdate {
  let batchMetadataUpdateEvent = changetype<BatchMetadataUpdate>(newMockEvent())

  batchMetadataUpdateEvent.parameters = new Array()

  batchMetadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_fromTokenId",
      ethereum.Value.fromUnsignedBigInt(_fromTokenId)
    )
  )
  batchMetadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_toTokenId",
      ethereum.Value.fromUnsignedBigInt(_toTokenId)
    )
  )

  return batchMetadataUpdateEvent
}

export function createClaimConditionsUpdatedEvent(
  claimConditions: Array<ethereum.Tuple>,
  resetEligibility: boolean
): ClaimConditionsUpdated {
  let claimConditionsUpdatedEvent =
    changetype<ClaimConditionsUpdated>(newMockEvent())

  claimConditionsUpdatedEvent.parameters = new Array()

  claimConditionsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "claimConditions",
      ethereum.Value.fromTupleArray(claimConditions)
    )
  )
  claimConditionsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "resetEligibility",
      ethereum.Value.fromBoolean(resetEligibility)
    )
  )

  return claimConditionsUpdatedEvent
}

export function createConsecutiveTransferEvent(
  fromTokenId: BigInt,
  toTokenId: BigInt,
  from: Address,
  to: Address
): ConsecutiveTransfer {
  let consecutiveTransferEvent = changetype<ConsecutiveTransfer>(newMockEvent())

  consecutiveTransferEvent.parameters = new Array()

  consecutiveTransferEvent.parameters.push(
    new ethereum.EventParam(
      "fromTokenId",
      ethereum.Value.fromUnsignedBigInt(fromTokenId)
    )
  )
  consecutiveTransferEvent.parameters.push(
    new ethereum.EventParam(
      "toTokenId",
      ethereum.Value.fromUnsignedBigInt(toTokenId)
    )
  )
  consecutiveTransferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  consecutiveTransferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return consecutiveTransferEvent
}

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

export function createDefaultRoyaltyEvent(
  newRoyaltyRecipient: Address,
  newRoyaltyBps: BigInt
): DefaultRoyalty {
  let defaultRoyaltyEvent = changetype<DefaultRoyalty>(newMockEvent())

  defaultRoyaltyEvent.parameters = new Array()

  defaultRoyaltyEvent.parameters.push(
    new ethereum.EventParam(
      "newRoyaltyRecipient",
      ethereum.Value.fromAddress(newRoyaltyRecipient)
    )
  )
  defaultRoyaltyEvent.parameters.push(
    new ethereum.EventParam(
      "newRoyaltyBps",
      ethereum.Value.fromUnsignedBigInt(newRoyaltyBps)
    )
  )

  return defaultRoyaltyEvent
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

export function createMetadataUpdateEvent(_tokenId: BigInt): MetadataUpdate {
  let metadataUpdateEvent = changetype<MetadataUpdate>(newMockEvent())

  metadataUpdateEvent.parameters = new Array()

  metadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_tokenId",
      ethereum.Value.fromUnsignedBigInt(_tokenId)
    )
  )

  return metadataUpdateEvent
}

export function createOwnerUpdatedEvent(
  prevOwner: Address,
  newOwner: Address
): OwnerUpdated {
  let ownerUpdatedEvent = changetype<OwnerUpdated>(newMockEvent())

  ownerUpdatedEvent.parameters = new Array()

  ownerUpdatedEvent.parameters.push(
    new ethereum.EventParam("prevOwner", ethereum.Value.fromAddress(prevOwner))
  )
  ownerUpdatedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownerUpdatedEvent
}

export function createPrimarySaleRecipientUpdatedEvent(
  recipient: Address
): PrimarySaleRecipientUpdated {
  let primarySaleRecipientUpdatedEvent =
    changetype<PrimarySaleRecipientUpdated>(newMockEvent())

  primarySaleRecipientUpdatedEvent.parameters = new Array()

  primarySaleRecipientUpdatedEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )

  return primarySaleRecipientUpdatedEvent
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

export function createRoyaltyForTokenEvent(
  tokenId: BigInt,
  royaltyRecipient: Address,
  royaltyBps: BigInt
): RoyaltyForToken {
  let royaltyForTokenEvent = changetype<RoyaltyForToken>(newMockEvent())

  royaltyForTokenEvent.parameters = new Array()

  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "royaltyRecipient",
      ethereum.Value.fromAddress(royaltyRecipient)
    )
  )
  royaltyForTokenEvent.parameters.push(
    new ethereum.EventParam(
      "royaltyBps",
      ethereum.Value.fromUnsignedBigInt(royaltyBps)
    )
  )

  return royaltyForTokenEvent
}

export function createSharedMetadataUpdatedEvent(
  name: string,
  description: string,
  imageURI: string,
  animationURI: string
): SharedMetadataUpdated {
  let sharedMetadataUpdatedEvent =
    changetype<SharedMetadataUpdated>(newMockEvent())

  sharedMetadataUpdatedEvent.parameters = new Array()

  sharedMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  sharedMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )
  sharedMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam("imageURI", ethereum.Value.fromString(imageURI))
  )
  sharedMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "animationURI",
      ethereum.Value.fromString(animationURI)
    )
  )

  return sharedMetadataUpdatedEvent
}

export function createTokensClaimedEvent(
  claimConditionIndex: BigInt,
  claimer: Address,
  receiver: Address,
  startTokenId: BigInt,
  quantityClaimed: BigInt
): TokensClaimed {
  let tokensClaimedEvent = changetype<TokensClaimed>(newMockEvent())

  tokensClaimedEvent.parameters = new Array()

  tokensClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "claimConditionIndex",
      ethereum.Value.fromUnsignedBigInt(claimConditionIndex)
    )
  )
  tokensClaimedEvent.parameters.push(
    new ethereum.EventParam("claimer", ethereum.Value.fromAddress(claimer))
  )
  tokensClaimedEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  tokensClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "startTokenId",
      ethereum.Value.fromUnsignedBigInt(startTokenId)
    )
  )
  tokensClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "quantityClaimed",
      ethereum.Value.fromUnsignedBigInt(quantityClaimed)
    )
  )

  return tokensClaimedEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  tokenId: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return transferEvent
}
