const {Files} = require('@zouloux/files');
const path = require('path');

// Le cache avec en clé le nom de fichier
// en valeur les informations et le contenu du fichier
let memCache;

// Le contenu de la page 404
let notFoundContent;

/**
 * Les mime-type selon les extensions de fichier.
 */
const headerFileTypeByExt = {
  'html': 'text/html',
  'woff': 'application/font-woff',
  'eot': 'application/font-eot',
  'ttf': 'application/font-ttf',
  'png': 'image/png',
  'jpg': 'image/jpg',
  'gif': 'image/gif',
  'mp4': 'video/mp4'
};

module.exports = {
  /**
   * Initialiser le cache mémoire
   * @param pNotFoundContent Le markup de la 404
   */
  init: pNotFoundContent => {
    notFoundContent = pNotFoundContent;
    memCache = {};
  },

  /**
   * Vider le cache
   */
  clearCache: () => {
    // On supprime tous les fichier sen cache mémoire
    memCache = {};
  },

  /**
   * Lire le contenu d'un fichier depuis le dossier public.
   * Si ce fichier est en cache, on retourne la version en cache.
   * Sinon on récupère depuis le système de fichier et on met en cache mémoire.
   * @param pFileToGet Chemin vers le fichier
   * @return {*}
   */
  getFile: pFileToGet => {
    // Si le fichier est en cache, on retourne cette version
    if (pFileToGet in memCache) return memCache[pFileToGet];

    // Cibler le fichier depuis
    const fileHandle = Files.getFiles(pFileToGet);

    // Si le fichier existe
    if (fileHandle.exists()) {
      // Récupérer l'extension du fichier
      const ext = pFileToGet
        .substr(pFileToGet.lastIndexOf('.') + 1, pFileToGet.length)
        .toLowerCase();

      // Read file content
      const content = fileHandle.read(null, true);

      // Alors on lit le fichier
      const fileData = {
        ext: ext,
        size: Buffer.byteLength(content, 'utf-8'),
        date: fileHandle.getLastModified(),
        content: content,
        type: ext in headerFileTypeByExt ? headerFileTypeByExt[ext] : null
      };

      // On l'enregistre en cache
      memCache[pFileToGet] = fileData;

      // Puis on le retourne
      return fileData;
    }

    // Pas trouvé, on retourne null
    else return null;
  },

  /**
   * Répondre un fichier en cache automatiquement via la response express.
   * Va envoyer le poid du fichier et son type via headers HTTP.
   * @param res L'objet response express
   * @param pFileToGet Le chemin vers le fichier
   */
  resFile: (res, pFileToGet) => {
    // Récupérer le fichier depuis le cache
    const file = module.exports.getFile(pFileToGet);

    // Si on ne trouve pas le fichier
    if (file == null) {
      res.status(404).send(notFoundContent);
      return;
    }

    // Envoyer le poid en header
    res.header('Content-Length', file.size);

    // Envoyer le type en header
    if (file.type != null) {
      res.header('Content-Type', file.type);
    }

    // Envoyer le contenu
    res.send(file.content);
  }
};
