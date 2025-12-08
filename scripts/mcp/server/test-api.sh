#!/bin/bash
#
# MCP Unified Server - API Test Suite
#
# Tests all API endpoints to verify Phase 2 implementation
#

set -e

API_URL="http://localhost:3456"

echo "======================================"
echo "MCP Unified Server - API Test Suite"
echo "======================================"
echo ""

# Test 1: Root endpoint
echo "1. Testing root endpoint..."
curl -s "$API_URL/" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf-8')), null, 2))"
echo ""

# Test 2: Health check
echo "2. Testing health endpoint..."
curl -s "$API_URL/mcp/health" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf-8')), null, 2))"
echo ""

# Test 3: List servers
echo "3. Testing GET /mcp/servers..."
curl -s "$API_URL/mcp/servers" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Servers:', d.data.servers.join(', '))"
echo ""

# Test 4: Get server manifest
echo "4. Testing GET /mcp/servers/:server..."
curl -s "$API_URL/mcp/servers/supabase" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log(JSON.stringify({name: d.data.name, version: d.data.version, tools: d.data.tools.length}, null, 2))"
echo ""

# Test 5: List tools for server
echo "5. Testing GET /mcp/servers/:server/tools..."
curl -s "$API_URL/mcp/servers/supabase/tools" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Total tools:', d.data.tools.length); console.log('First 5:', d.data.tools.slice(0,5).map(t=>t.name).join(', '))"
echo ""

# Test 6: Get tool definition
echo "6. Testing GET /mcp/servers/:server/tools/:tool..."
curl -s "$API_URL/mcp/servers/supabase/tools/query-table" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log(JSON.stringify({name: d.data.name, description: d.data.description, tags: d.data.tags}, null, 2))"
echo ""

# Test 7: Search tools
echo "7. Testing GET /mcp/tools/search?q=query..."
curl -s "$API_URL/mcp/tools/search?q=database" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Found', d.data.count, 'tools matching \"database\"'); console.log('First 3:', d.data.results.slice(0,3).map(r=>r.server+'/'+r.tool.name).join(', '))"
echo ""

# Test 8: Get registry stats
echo "8. Testing GET /mcp/stats..."
curl -s "$API_URL/mcp/stats" | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf-8')), null, 2))"
echo ""

# Test 9: Execute a tool
echo "9. Testing POST /mcp/servers/:server/tools/:tool/run..."
curl -s -X POST "$API_URL/mcp/servers/supabase/tools/list-users/run" \
  -H "Content-Type: application/json" \
  -d '{}' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log(JSON.stringify({success: d.success, executionTimeMs: d.metadata?.executionTimeMs, tool: d.metadata?.tool}, null, 2))"
echo ""

# Test 10: Get execution history
echo "10. Testing GET /mcp/history..."
curl -s "$API_URL/mcp/history" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Total executions:', d.data.count, '/', d.data.maxSize); if(d.data.count > 0) console.log('Latest:', d.data.history[0].server + '/' + d.data.history[0].tool + ' (' + d.data.history[0].durationMs + 'ms)')"
echo ""

# Error handling tests
echo "======================================"
echo "Error Handling Tests"
echo "======================================"
echo ""

# Test 11: Invalid server
echo "11. Testing 404 - Invalid server..."
curl -s "$API_URL/mcp/servers/invalid" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Error code:', d.error?.code, '| Message:', d.error?.message)"
echo ""

# Test 12: Invalid tool
echo "12. Testing 404 - Invalid tool..."
curl -s "$API_URL/mcp/servers/supabase/tools/invalid-tool" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Error code:', d.error?.code, '| Message:', d.error?.message)"
echo ""

# Test 13: Empty search query
echo "13. Testing 400 - Empty search query..."
curl -s "$API_URL/mcp/tools/search?q=" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf-8')); console.log('Error code:', d.error?.code, '| Message:', d.error?.message)"
echo ""

echo "======================================"
echo "All tests completed!"
echo "======================================"
