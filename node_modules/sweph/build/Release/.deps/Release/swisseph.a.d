cmd_Release/swisseph.a := ln -f "Release/obj.target/swisseph.a" "Release/swisseph.a" 2>/dev/null || (rm -rf "Release/swisseph.a" && cp -af "Release/obj.target/swisseph.a" "Release/swisseph.a")
