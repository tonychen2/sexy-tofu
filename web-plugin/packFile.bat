@echo on

setlocal enabledelayedexpansion
set chromeExe=C:\Program Files\Google\Chrome\Application\chrome.exe
set Zip=C:\Program Files\7-Zip\
set tmpFolder=tmp

::back to up folder
pushd ..
echo.
echo   ©°©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©´
echo     This tool will help to pack the extension, and pack name as "%tmpFolder%", 
echo        tmp file in : "./%tmpFolder%"
echo     The tool need 7zip for zip the %tmpFolder%,
echo       Zip folder: %Zip%
echo     You can define the tmpFolder in the script as: set tmpFolder=[New Name]
echo   ©¸©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¼
echo.

if exist %tmpFolder% rd %tmpFolder% /s /q
xcopy /S /Y .\web-plugin  .\%tmpFolder%\ /Exclude:.\web-plugin\exclude.txt >nul

"%zip%\7z.exe" a  %tmpFolder%.zip  .\%tmpFolder%

echo.
echo If exist perm file here, will reuse it, or will generate a new file...
if Exist %tmpFolder%.pem (
  set pemCmd= -pack-extension-key=%cd%\%tmpFolder%.pem
) else (
set pemCmd= 
)

if Exist %tmpFolder%.crx del %tmpFolder%.crx

"%chromeExe%" --pack-extension=%cd%\%tmpFolder%\ %pemCmd%

echo related generated files:
echo.
dir %tmpFolder%* | findstr tmp

echo.
echo Remove temp folder: %tmpFolder% if we created it.
if exist %tmpFolder% rd %tmpFolder% /s /q
popd