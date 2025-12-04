# Guía para resolver conflictos de merge

Si el PR muestra dos conflictos, sigue estos pasos para resolverlos de forma segura.

1. **Trae los últimos cambios del repositorio remoto**
   ```bash
   git fetch origin
   ```

2. **Asegúrate de estar en tu rama de trabajo** (la del PR)
   ```bash
   git status -sb
   # Debe mostrar algo como: "## <tu-rama>"
   ```

3. **Intenta mezclar la rama base (p. ej. `main`) en tu rama**
   ```bash
   git merge origin/main
   ```
   - Git marcará los archivos con conflicto. Revisa la lista en la salida del comando o con `git status`.

4. **Resuelve cada conflicto manualmente**
   - Abre cada archivo con marcas `<<<<<<<`, `=======`, `>>>>>>>`.
   - Decide qué versión conservar o cómo combinar los cambios.
   - Borra las marcas de conflicto y guarda el archivo.

5. **Verifica que el código compile y las pruebas básicas pasan**
   ```bash
   npm install
   npm run build
   ```

6. **Marca los archivos como resueltos y crea un commit**
   ```bash
   git add <archivo-con-resolucion>
   git commit -m "Resolve merge conflicts"
   ```

7. **Sube los cambios a tu rama remota** y actualiza el PR
   ```bash
   git push origin <tu-rama>
   ```

8. **Si el conflicto persiste en el PR**
   - Repite el proceso, asegurándote de que el PR esté apuntando a la rama correcta y que tu rama esté actualizada con `origin/main`.

Consejo: si prefieres rebase en lugar de merge, puedes usar `git rebase origin/main` y resolver los conflictos en cada commit, finalizando con `git rebase --continue`.
