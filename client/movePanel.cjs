const fs = require('fs');
let t = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

const startMarker = "{/* ── FEEDBACK TAB ── */}";
// The exact string that ends the feedback block
const endStr = `                                </div>
                            </div>
                        )}
                    </div>
                )}`;
const endStrLF = endStr.replace(/\r\n/g, '\n');
const endStrCRLF = endStr.replace(/\n/g, '\r\n');

let endIdx = t.indexOf(endStrCRLF);
if (endIdx === -1) endIdx = t.indexOf(endStrLF);

if (endIdx !== -1) {
    const endLen = endStrCRLF.length; // Approximate, but we just need to get past the )}
    const blockEnd = endIdx + (t.includes(endStrCRLF) ? endStrCRLF.length : endStrLF.length);
    const startIdx = t.lastIndexOf(startMarker, endIdx);

    if (startIdx !== -1 && startIdx < t.length / 2) {
        // It's in the top half (StatCard area), so we need to move it
        const block = t.substring(startIdx, blockEnd);
        t = t.substring(0, startIdx) + t.substring(blockEnd);

        // Now append it to the end of the file, right before the final `</div>\n        </div>\n    );\n}`
        const appendAnchor = "            </div>\r\n        </div>\r\n    );\r\n}";
        const appendAnchorLF = "            </div>\n        </div>\n    );\n}";

        if (t.includes(appendAnchor)) {
            t = t.replace(appendAnchor, block + "\r\n" + appendAnchor);
            console.log('Fixed panel placement (CRLF)');
        } else if (t.includes(appendAnchorLF)) {
            t = t.replace(appendAnchorLF, block + "\n" + appendAnchorLF);
            console.log('Fixed panel placement (LF)');
        } else {
            console.log('Could not find file end anchor');
        }

        fs.writeFileSync('src/pages/AdminDashboard.jsx', t, 'utf8');
    } else {
        console.log('Block already in right place, or start not found.');
    }
} else {
    console.log('End string not found.');
}
