cmd_Release/sweph.node := ln -f "Release/obj.target/sweph.node" "Release/sweph.node" 2>/dev/null || (rm -rf "Release/sweph.node" && cp -af "Release/obj.target/sweph.node" "Release/sweph.node")
