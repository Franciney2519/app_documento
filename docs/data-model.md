# Modelagem de Dados

## Entidades principais

### Usuários e acesso

- `User`: identidade do colaborador, gestor, administrador ou aprovador
- `Role`: perfil funcional
- `Permission`: permissão granular por módulo e ação
- `UserRole`: associação N:N entre usuário e perfil
- `RolePermission`: associação N:N entre perfil e permissão
- `UserSector`: associação N:N entre usuário e setor autorizado

### Estrutura do portal

- `Sector`: setor corporativo parametrizável
- `Category`: categoria e subcategoria em estrutura hierárquica
- `SectorCategory`: controla a exibição de categorias por setor
- `PortalConfig`: configurações institucionais do portal

### Documentos e governança

- `Document`: documento lógico principal
- `DocumentVersion`: histórico de versões físicas e metadados congelados
- `DocumentApproval`: transições de workflow e aprovações

### Auditoria

- `AuditLog`: trilha das ações relevantes

## Relacionamentos

- Um `User` pode possuir vários `Role`
- Um `Role` pode possuir várias `Permission`
- Um `User` pode acessar vários `Sector`
- Um `Sector` pode exibir várias `Category`
- Uma `Category` pode ter `parentId` para subcategorias
- Um `Document` pertence a um `Sector` e a uma `Category`
- Um `Document` pode ter muitas `DocumentVersion`
- Um `Document` pode ter muitas `DocumentApproval`
- Toda operação relevante pode gerar um `AuditLog`

## Campos-chave sugeridos

### User

- `id`, `name`, `email`, `passwordHash`
- `status`: `ACTIVE`, `INACTIVE`, `BLOCKED`
- `createdAt`, `updatedAt`, `lastLoginAt`

### Sector

- `id`, `name`, `slug`, `description`
- `sortOrder`, `isActive`

### Category

- `id`, `name`, `slug`, `description`, `icon`
- `parentId`, `sortOrder`, `isActive`
- `kind`: `DOCUMENT_LIBRARY`, `SUPPORT_CHANNEL`, `CHECKLIST_HUB`

### Document

- `id`, `title`, `code`, `documentType`
- `description`, `versionLabel`, `versionNumber`
- `publicationDate`, `reviewDate`, `effectiveDate`
- `status`, `visibility`
- `keywords`
- `filePath`, `fileName`, `mimeType`, `fileSize`
- `sectorId`, `categoryId`, `subcategoryId`, `ownerId`

### AuditLog

- `id`, `action`, `entityType`, `entityId`
- `actorId`, `metadata`, `ipAddress`, `userAgent`, `occurredAt`
