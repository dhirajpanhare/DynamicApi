-- ====================================
-- Dynamic API Database Setup Script
-- For MySQL
-- ====================================

CREATE DATABASE IF NOT EXISTS DynamicApiDb;
USE DynamicApiDb;

-- Create EntityConfigurations table
CREATE TABLE IF NOT EXISTS EntityConfigurations (
    EntityConfigId INT AUTO_INCREMENT PRIMARY KEY,
    EntityName VARCHAR(100) NOT NULL UNIQUE,
    TableName VARCHAR(100) NOT NULL,
    DisplayName VARCHAR(150),
    Description VARCHAR(500),
    BusinessProcessId INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    ConfigurationData JSON,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME,
    
    INDEX idx_EntityName (EntityName),
    INDEX idx_BusinessProcessId (BusinessProcessId),
    INDEX idx_IsActive (IsActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FieldConfigurations table
CREATE TABLE IF NOT EXISTS FieldConfigurations (
    FieldConfigId INT AUTO_INCREMENT PRIMARY KEY,
    EntityConfigId INT NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    DataType VARCHAR(50) NOT NULL,
    DisplayName VARCHAR(150),
    DisplayLength INT,
    IsRequired BOOLEAN DEFAULT FALSE,
    ShowInGrid BOOLEAN DEFAULT TRUE,
    ShowInForm BOOLEAN DEFAULT TRUE,
    ShowInFilter BOOLEAN DEFAULT TRUE,
    SortOrder INT,
    ValidationRule VARCHAR(500),
    FieldProperties JSON,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME,
    
    FOREIGN KEY (EntityConfigId) REFERENCES EntityConfigurations(EntityConfigId) ON DELETE CASCADE,
    INDEX idx_EntityConfigId (EntityConfigId),
    INDEX idx_FieldName (FieldName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create EntityHierarchies table
CREATE TABLE IF NOT EXISTS EntityHierarchies (
    HierarchyId INT AUTO_INCREMENT PRIMARY KEY,
    ParentEntityId INT NOT NULL,
    ChildEntityId INT NOT NULL,
    RelationshipName VARCHAR(100),
    ParentKeyField VARCHAR(100),
    ChildKeyField VARCHAR(100),
    IsCascading BOOLEAN DEFAULT FALSE,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME,
    
    INDEX idx_ParentEntityId (ParentEntityId),
    INDEX idx_ChildEntityId (ChildEntityId),
    INDEX idx_Relationship (ParentEntityId, ChildEntityId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ExecutionLogs table
CREATE TABLE IF NOT EXISTS ExecutionLogs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProcedureName VARCHAR(255),
    Parameters LONGTEXT,
    Status BOOLEAN NOT NULL,
    Message VARCHAR(500),
    ExecutionTime INT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_CreatedAt (CreatedAt),
    INDEX idx_ProcedureName_CreatedAt (ProcedureName, CreatedAt),
    INDEX idx_Status_CreatedAt (Status, CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- Dynamic API CRUD Stored Procedures
-- ====================================

-- ====================================
-- EntityConfiguration Procedures
-- ====================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityConfigurationById(
    IN p_EntityConfigId INT
)
BEGIN
    SELECT EntityConfigId, EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive, 
           CreatedDate, ModifiedDate
    FROM EntityConfigurations
    WHERE EntityConfigId = p_EntityConfigId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetAllEntityConfigurations()
BEGIN
    SELECT EntityConfigId, EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive, 
           CreatedDate, ModifiedDate
    FROM EntityConfigurations
    ORDER BY EntityName;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetActiveEntityConfigurations()
BEGIN
    SELECT EntityConfigId, EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive, 
           CreatedDate, ModifiedDate
    FROM EntityConfigurations
    WHERE IsActive = TRUE
    ORDER BY EntityName;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityConfigurationByBusinessProcessId(
    IN p_BusinessProcessId INT
)
BEGIN
    SELECT EntityConfigId, EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive, 
           CreatedDate, ModifiedDate
    FROM EntityConfigurations
    WHERE BusinessProcessId = p_BusinessProcessId
    ORDER BY EntityName;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityConfigurationByName(
    IN p_EntityName VARCHAR(100)
)
BEGIN
    SELECT EntityConfigId, EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive, 
           CreatedDate, ModifiedDate
    FROM EntityConfigurations
    WHERE EntityName = p_EntityName;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityConfigurationsPaged(
    IN p_SkipRows INT,
    IN p_PageSize INT
)
BEGIN
    SELECT EntityConfigId, EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive, 
           CreatedDate, ModifiedDate
    FROM EntityConfigurations
    ORDER BY EntityName
    LIMIT p_PageSize OFFSET p_SkipRows;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_InsertEntityConfiguration(
    IN p_EntityName VARCHAR(100),
    IN p_TableName VARCHAR(100),
    IN p_DisplayName VARCHAR(150),
    IN p_Description VARCHAR(500),
    IN p_BusinessProcessId INT,
    IN p_IsActive BOOLEAN,
    IN p_ConfigurationData JSON
)
BEGIN
    INSERT INTO EntityConfigurations (EntityName, TableName, DisplayName, Description, BusinessProcessId, 
                                      IsActive, ConfigurationData, CreatedDate)
    VALUES (p_EntityName, p_TableName, p_DisplayName, p_Description, p_BusinessProcessId, 
            p_IsActive, p_ConfigurationData, NOW());
    
    SELECT LAST_INSERT_ID() as EntityConfigId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_UpdateEntityConfiguration(
    IN p_EntityConfigId INT,
    IN p_EntityName VARCHAR(100),
    IN p_TableName VARCHAR(100),
    IN p_DisplayName VARCHAR(150),
    IN p_Description VARCHAR(500),
    IN p_BusinessProcessId INT,
    IN p_IsActive BOOLEAN,
    IN p_ConfigurationData JSON
)
BEGIN
    UPDATE EntityConfigurations
    SET EntityName = p_EntityName,
        TableName = p_TableName,
        DisplayName = p_DisplayName,
        Description = p_Description,
        BusinessProcessId = p_BusinessProcessId,
        IsActive = p_IsActive,
        ConfigurationData = p_ConfigurationData,
        ModifiedDate = NOW()
    WHERE EntityConfigId = p_EntityConfigId;
    
    SELECT ROW_COUNT() as RowsAffected;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_DeleteEntityConfiguration(
    IN p_EntityConfigId INT
)
BEGIN
    DELETE FROM EntityConfigurations WHERE EntityConfigId = p_EntityConfigId;
    SELECT ROW_COUNT() as RowsAffected;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_EntityConfigurationExists(
    IN p_EntityConfigId INT
)
BEGIN
    SELECT EXISTS(SELECT 1 FROM EntityConfigurations WHERE EntityConfigId = p_EntityConfigId) as Exists;
END$$
DELIMITER ;

-- ====================================
-- FieldConfiguration Procedures
-- ====================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetFieldConfigurationById(
    IN p_FieldConfigId INT
)
BEGIN
    SELECT FieldConfigId, EntityConfigId, FieldName, DataType, DisplayName, DisplayLength, IsRequired,
           ShowInGrid, ShowInForm, ShowInFilter, SortOrder, ValidationRule, CreatedDate, ModifiedDate
    FROM FieldConfigurations
    WHERE FieldConfigId = p_FieldConfigId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetAllFieldConfigurations()
BEGIN
    SELECT FieldConfigId, EntityConfigId, FieldName, DataType, DisplayName, DisplayLength, IsRequired,
           ShowInGrid, ShowInForm, ShowInFilter, SortOrder, ValidationRule, CreatedDate, ModifiedDate
    FROM FieldConfigurations
    ORDER BY EntityConfigId, SortOrder;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetFieldConfigurationsByEntity(
    IN p_EntityConfigId INT
)
BEGIN
    SELECT FieldConfigId, EntityConfigId, FieldName, DataType, DisplayName, DisplayLength, IsRequired,
           ShowInGrid, ShowInForm, ShowInFilter, SortOrder, ValidationRule, CreatedDate, ModifiedDate
    FROM FieldConfigurations
    WHERE EntityConfigId = p_EntityConfigId
    ORDER BY SortOrder;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetFieldConfigurationByName(
    IN p_EntityConfigId INT,
    IN p_FieldName VARCHAR(100)
)
BEGIN
    SELECT FieldConfigId, EntityConfigId, FieldName, DataType, DisplayName, DisplayLength, IsRequired,
           ShowInGrid, ShowInForm, ShowInFilter, SortOrder, ValidationRule, CreatedDate, ModifiedDate
    FROM FieldConfigurations
    WHERE EntityConfigId = p_EntityConfigId AND FieldName = p_FieldName;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetFieldConfigurationsPaged(
    IN p_SkipRows INT,
    IN p_PageSize INT
)
BEGIN
    SELECT FieldConfigId, EntityConfigId, FieldName, DataType, DisplayName, DisplayLength, IsRequired,
           ShowInGrid, ShowInForm, ShowInFilter, SortOrder, ValidationRule, CreatedDate, ModifiedDate
    FROM FieldConfigurations
    ORDER BY EntityConfigId, SortOrder
    LIMIT p_PageSize OFFSET p_SkipRows;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_InsertFieldConfiguration(
    IN p_EntityConfigId INT,
    IN p_FieldName VARCHAR(100),
    IN p_DataType VARCHAR(50),
    IN p_DisplayName VARCHAR(150),
    IN p_DisplayLength INT,
    IN p_IsRequired BOOLEAN,
    IN p_ShowInGrid BOOLEAN,
    IN p_ShowInForm BOOLEAN,
    IN p_ShowInFilter BOOLEAN,
    IN p_SortOrder INT,
    IN p_ValidationRule VARCHAR(500),
    IN p_FieldProperties JSON
)
BEGIN
    INSERT INTO FieldConfigurations (EntityConfigId, FieldName, DataType, DisplayName, DisplayLength,
                                     IsRequired, ShowInGrid, ShowInForm, ShowInFilter, SortOrder, 
                                     ValidationRule, FieldProperties, CreatedDate)
    VALUES (p_EntityConfigId, p_FieldName, p_DataType, p_DisplayName, p_DisplayLength, p_IsRequired,
            p_ShowInGrid, p_ShowInForm, p_ShowInFilter, p_SortOrder, p_ValidationRule, p_FieldProperties, NOW());
    
    SELECT LAST_INSERT_ID() as FieldConfigId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_UpdateFieldConfiguration(
    IN p_FieldConfigId INT,
    IN p_EntityConfigId INT,
    IN p_FieldName VARCHAR(100),
    IN p_DataType VARCHAR(50),
    IN p_DisplayName VARCHAR(150),
    IN p_DisplayLength INT,
    IN p_IsRequired BOOLEAN,
    IN p_ShowInGrid BOOLEAN,
    IN p_ShowInForm BOOLEAN,
    IN p_ShowInFilter BOOLEAN,
    IN p_SortOrder INT,
    IN p_ValidationRule VARCHAR(500),
    IN p_FieldProperties JSON
)
BEGIN
    UPDATE FieldConfigurations
    SET EntityConfigId = p_EntityConfigId,
        FieldName = p_FieldName,
        DataType = p_DataType,
        DisplayName = p_DisplayName,
        DisplayLength = p_DisplayLength,
        IsRequired = p_IsRequired,
        ShowInGrid = p_ShowInGrid,
        ShowInForm = p_ShowInForm,
        ShowInFilter = p_ShowInFilter,
        SortOrder = p_SortOrder,
        ValidationRule = p_ValidationRule,
        FieldProperties = p_FieldProperties,
        ModifiedDate = NOW()
    WHERE FieldConfigId = p_FieldConfigId;
    
    SELECT ROW_COUNT() as RowsAffected;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_DeleteFieldConfiguration(
    IN p_FieldConfigId INT
)
BEGIN
    DELETE FROM FieldConfigurations WHERE FieldConfigId = p_FieldConfigId;
    SELECT ROW_COUNT() as RowsAffected;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_FieldConfigurationExists(
    IN p_FieldConfigId INT
)
BEGIN
    SELECT EXISTS(SELECT 1 FROM FieldConfigurations WHERE FieldConfigId = p_FieldConfigId) as Exists;
END$$
DELIMITER ;

-- ====================================
-- EntityHierarchy Procedures
-- ====================================

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityHierarchyById(
    IN p_HierarchyId INT
)
BEGIN
    SELECT HierarchyId, ParentEntityId, ChildEntityId, RelationshipName, ParentKeyField, ChildKeyField,
           IsCascading, CreatedDate, ModifiedDate
    FROM EntityHierarchies
    WHERE HierarchyId = p_HierarchyId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetAllEntityHierarchies()
BEGIN
    SELECT HierarchyId, ParentEntityId, ChildEntityId, RelationshipName, ParentKeyField, ChildKeyField,
           IsCascading, CreatedDate, ModifiedDate
    FROM EntityHierarchies
    ORDER BY ParentEntityId, ChildEntityId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityHierarchiesByParent(
    IN p_ParentEntityId INT
)
BEGIN
    SELECT HierarchyId, ParentEntityId, ChildEntityId, RelationshipName, ParentKeyField, ChildKeyField,
           IsCascading, CreatedDate, ModifiedDate
    FROM EntityHierarchies
    WHERE ParentEntityId = p_ParentEntityId
    ORDER BY ChildEntityId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityHierarchiesByChild(
    IN p_ChildEntityId INT
)
BEGIN
    SELECT HierarchyId, ParentEntityId, ChildEntityId, RelationshipName, ParentKeyField, ChildKeyField,
           IsCascading, CreatedDate, ModifiedDate
    FROM EntityHierarchies
    WHERE ChildEntityId = p_ChildEntityId
    ORDER BY ParentEntityId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityHierarchiesPaged(
    IN p_SkipRows INT,
    IN p_PageSize INT
)
BEGIN
    SELECT HierarchyId, ParentEntityId, ChildEntityId, RelationshipName, ParentKeyField, ChildKeyField,
           IsCascading, CreatedDate, ModifiedDate
    FROM EntityHierarchies
    ORDER BY ParentEntityId, ChildEntityId
    LIMIT p_PageSize OFFSET p_SkipRows;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_InsertEntityHierarchy(
    IN p_ParentEntityId INT,
    IN p_ChildEntityId INT,
    IN p_RelationshipName VARCHAR(100),
    IN p_ParentKeyField VARCHAR(100),
    IN p_ChildKeyField VARCHAR(100),
    IN p_IsCascading BOOLEAN
)
BEGIN
    INSERT INTO EntityHierarchies (ParentEntityId, ChildEntityId, RelationshipName, ParentKeyField,
                                   ChildKeyField, IsCascading, CreatedDate)
    VALUES (p_ParentEntityId, p_ChildEntityId, p_RelationshipName, p_ParentKeyField, p_ChildKeyField,
            p_IsCascading, NOW());
    
    SELECT LAST_INSERT_ID() as HierarchyId;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_UpdateEntityHierarchy(
    IN p_HierarchyId INT,
    IN p_ParentEntityId INT,
    IN p_ChildEntityId INT,
    IN p_RelationshipName VARCHAR(100),
    IN p_ParentKeyField VARCHAR(100),
    IN p_ChildKeyField VARCHAR(100),
    IN p_IsCascading BOOLEAN
)
BEGIN
    UPDATE EntityHierarchies
    SET ParentEntityId = p_ParentEntityId,
        ChildEntityId = p_ChildEntityId,
        RelationshipName = p_RelationshipName,
        ParentKeyField = p_ParentKeyField,
        ChildKeyField = p_ChildKeyField,
        IsCascading = p_IsCascading,
        ModifiedDate = NOW()
    WHERE HierarchyId = p_HierarchyId;
    
    SELECT ROW_COUNT() as RowsAffected;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_DeleteEntityHierarchy(
    IN p_HierarchyId INT
)
BEGIN
    DELETE FROM EntityHierarchies WHERE HierarchyId = p_HierarchyId;
    SELECT ROW_COUNT() as RowsAffected;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_EntityHierarchyExists(
    IN p_HierarchyId INT
)
BEGIN
    SELECT EXISTS(SELECT 1 FROM EntityHierarchies WHERE HierarchyId = p_HierarchyId) as Exists;
END$$
DELIMITER ;

-- ====================================
-- Count Stored Procedures
-- ====================================

-- Count EntityConfigurations
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityConfigurationsCount()
BEGIN
    SELECT COUNT(*) as TotalCount
    FROM EntityConfigurations;
END$$
DELIMITER ;

-- Count FieldConfigurations
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetFieldConfigurationsCount()
BEGIN
    SELECT COUNT(*) as TotalCount
    FROM FieldConfigurations;
END$$
DELIMITER ;

-- Count EntityHierarchies
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS SP_GetEntityHierarchiesCount()
BEGIN
    SELECT COUNT(*) as TotalCount
    FROM EntityHierarchies;
END$$
DELIMITER ;

-- ====================================
-- Sample Data (Optional - for testing)
-- ====================================

-- Insert sample entity configurations for DynamicApi
-- These define the metadata entities that the Dynamic API uses
-- Note: Uncomment these lines if you want sample data, otherwise the system will work with empty tables

-- INSERT INTO EntityConfigurations (EntityName, TableName, DisplayName, Description, BusinessProcessId, IsActive)
-- VALUES 
-- ('Users', 'Users', 'User Management', 'User configuration entity', 1, TRUE),
-- ('Roles', 'Roles', 'Role Management', 'Role configuration entity', 1, TRUE),
-- ('Permissions', 'Permissions', 'Permission Management', 'Permission configuration entity', 1, TRUE);

-- ====================================
-- End of Database Setup
-- ====================================
