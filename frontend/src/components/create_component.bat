@echo off
setlocal enabledelayedexpansion

set /p componentName="Enter component name: "
mkdir %componentName%

(
echo import React from 'react';
echo import styles from './%componentName%.module.scss';
echo.
echo const %componentName%: React.FC = ^(^) ^=^> {
echo   return ^(
echo     ^<div className={styles.%componentName%.toLowerCase^(^)^}^>
echo       %componentName% Component
echo     ^</div^>
echo   ^);
echo };
echo.
echo export default %componentName%;
) > %componentName%\%componentName%.tsx

(
echo hi bitch
) > %componentName%\%componentName%.module.scss

echo Component %componentName% created successfully!