-- FIFA Store Lua-based file caching module
-- Caches responses in URI-based directory structure
ngx.log(ngx.ERR, "--- DEBUG: init.lua 已被成功加载 ---")
local _M = {}

local cache_base_path = "/usr/local/openresty/nginx/html"

-- Ensure directory exists
local function ensure_dir(path)
    -- Windows compatible directory creation
    local cmd = 'mkdir -p "' .. path .. '" 2>nul || cd .'
    os.execute(cmd)
end

-- Sanitize query parameters to create a safe filename
local function sanitize_params(args)
    if not args or args == "" then
        return nil
    end
    
    -- Remove characters that are not safe for filenames
    -- Keep only alphanumeric, hyphens, underscores, and dots
    local sanitized = args:gsub("[^a-zA-Z0-9_.%-]", "_")
    
    -- Limit length to avoid excessively long filenames
    if #sanitized > 200 then
        sanitized = sanitized:sub(1, 200)
    end
    
    return sanitized
end

-- Get cache file path based on URI and query parameters
local function get_cache_file_path(uri, args)
    -- Remove trailing slash for consistency
    local clean_uri = uri:gsub("/$", "")
    if clean_uri == "" then
        clean_uri = "/index"
    end
    
    -- Base path from URI (directory part)
    local base_path = cache_base_path .. clean_uri
    
    -- Determine the filename
    local filename = "index.html"
    
    -- Check if URI already has a file extension
    local has_extension = clean_uri:match("%.%w+$")
    if has_extension then
        -- Extract the filename from URI
        filename = clean_uri:match("([^/]+)$")
        base_path = cache_base_path .. clean_uri:gsub("[^/]+$", "")
    end
    
    -- If there are query parameters, append them to the filename
    -- Use @ separator instead of ? because ? is not allowed in Windows filenames
    local sanitized_args = sanitize_params(args)
    if sanitized_args then
        filename = filename .. "@" .. sanitized_args
    end
    
    -- Ensure directory path ends with /
    if not base_path:match("[\\/]$") then
        base_path = base_path .. "/"
    end
    
    return base_path .. filename
end

-- Check if cache file exists and is valid
function _M.get_cached_response(uri, args)
    local cache_file = get_cache_file_path(uri, args)
    
    local file = io.open(cache_file, "r")
    if not file then
        return nil
    end
    
    -- Read the entire cached content
    local content = file:read("*all")
    file:close()
    
    return content
end

-- Save response to cache file
function _M.save_to_cache(uri, args, content, content_type)
    local cache_file = get_cache_file_path(uri, args)
    
    -- Ensure directory exists
    local dir_path = cache_file:match("(.+)/[^/]+$")
    if dir_path then
        ensure_dir(dir_path)
    end
    
    -- Write content to file
    local file = io.open(cache_file, "w")
    if not file then
        ngx.log(ngx.ERR, "Failed to open cache file for writing: ", cache_file)
        return false
    end
    
    file:write(content)
    file:close()
    
    ngx.log(ngx.INFO, "Cached response to: ", cache_file)
    return true
end

-- Clean URI for cache key (include query parameters for unique caching)
function _M.get_cache_key(uri, args)
    -- Include query parameters in cache key for unique caching
    -- Use @ separator for consistency with file naming
    if args and args ~= "" then
        return uri .. "@" .. args
    end
    return uri
end

return _M

