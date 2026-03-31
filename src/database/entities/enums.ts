export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum ManifestationStatus {
  PENDING = 'pending',
  ACHIEVED = 'achieved',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum GoalVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export enum ProofType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text'
}

export enum ReactionType {
  LIKE = 'like',
  FIRE = 'fire',
  CLAP = 'clap'
}

export enum NotificationType {
  GOAL_REMINDER = 'goal_reminder',
  GOAL_ACHIEVED = 'goal_achieved',
  GOAL_FAILED = 'goal_failed',
  COMMENT = 'comment',
  REACTION = 'reaction',
  FOLLOW = 'follow'
}
