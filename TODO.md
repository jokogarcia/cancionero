# TODO
- ConvertV1ToV2: should detect tablature lines and present them without alterations. Perhaps detect the |---| pattern to identify tablature and skip the chord parsing for those lines. This would preserve the integrity of tablature sections while still allowing for chord parsing in regular lines.
- Song Render Page. Should block device sleep and restore it when leaving the page. Use the Screen Wake Lock API to achieve this. 
- Cleanup dead code
- Main page: display local songs in a separate tab.
- Handle the case where the user revokes access to the local folder after granting it. The app should detect this and update the UI accordingly, perhaps by showing a message that access has been revoked and providing an option to re-grant access.
- Settings page: add button to re-scan the local folder.
- Future: add support for gzipped song files. (gz format). For full compatibility with OLGA archive.