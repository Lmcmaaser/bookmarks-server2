TRUNCATE bookmarks;

-- Removes all rows from a table/specified partitions of a table
-- But does not log the individual row deletions. 
-- TRUNCATE TABLE is similar to the DELETE statement with no WHERE clause; however,
-- TRUNCATE TABLE is faster and uses fewer system and transaction log resources.
