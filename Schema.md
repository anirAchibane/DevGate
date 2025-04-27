# Data Structure

## Users
- **bio**: `string`
- **createdAt**: `datetime`
- **email**: `string`
- **avatar**: `string`
- **username**: `string`

### Subcollections

#### Objectives
- **lastUpdated**: `datetime`
- **startDate**: `datetime`
- **status**: `string`
- **title**: `string`

#### Projects
- **createdAt**: `datetime`
- **description**: `string`
- **githubURL**: `string`
- **stack**: `array of strings`
- **title**: `string`
- **visibility**: `string`

#### Skills
- **acquiredAt**: `datetime`
- **level**: `string`
- **name**: `string`
- **updatedAt**: `datetime`

---

## Public Projects
- **createdAt**: `datetime`
- **stack**: `array of strings`
- **title**: `string`
- **uid**: `string`

---

## Public Feed
- **addedAt**: `datetime`
- **content**: `string`
- **pid**: `string`
- **summary**: `string`
- **type**: `string`
- **uid**: `string`

### Subcollection: Comments
- **content**: `string`
- **createdAt**: `datetime`
- **parentId**: `string` (only if it’s a reply)
- **uid**: `string`
