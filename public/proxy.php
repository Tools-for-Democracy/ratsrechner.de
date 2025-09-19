<?php
// PHP-Proxy für CSV-Daten mit 1-Minuten-Cache
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: text/csv; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$url = $_GET['url'] ?? '';
if (empty($url)) {
    http_response_code(400);
    echo 'URL parameter is required';
    exit();
}

// Validiere URL (nur wahlen.citeq.de und wahlen.regioit.de erlauben)
if (!preg_match('/^https:\/\/wahlen\.citeq\.de\//', $url) && !preg_match('/^https:\/\/wahlen\.regioit\.de\//', $url)) {
    http_response_code(400);
    echo 'Invalid URL domain';
    exit();
}

// Cache-Datei basierend auf URL-Hash
$cacheDir = __DIR__ . '/cache/';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$urlHash = md5($url);
$cacheFile = $cacheDir . $urlHash . '.cache';
$cacheMetaFile = $cacheDir . $urlHash . '.meta';

// Prüfe ob Cache existiert und noch gültig ist (1 Minute = 60 Sekunden)
$useCache = false;
if (file_exists($cacheFile) && file_exists($cacheMetaFile)) {
    $cacheTime = filemtime($cacheFile);
    $currentTime = time();
    
    // Cache ist gültig wenn weniger als 60 Sekunden alt
    if (($currentTime - $cacheTime) < 30) {
        $useCache = true;
    }
}

if ($useCache) {
    // Verwende gecachte Daten
    $data = file_get_contents($cacheFile);
    if ($data !== false) {
        // Setze Cache-Header
        header('X-Cache: HIT');
        header('X-Cache-Age: ' . (time() - filemtime($cacheFile)));
        echo $data;
        exit();
    }
}

// Cache miss oder ungültig - lade neue Daten
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'User-Agent: Mozilla/5.0 (compatible; Ratsrechner.de)',
            'Accept: text/csv,text/plain,*/*'
        ],
        'timeout' => 30
    ]
]);

$data = file_get_contents($url, false, $context);
if ($data === false) {
    http_response_code(500);
    echo 'Failed to fetch data';
    exit();
}

// Speichere in Cache
file_put_contents($cacheFile, $data);
file_put_contents($cacheMetaFile, json_encode([
    'url' => $url,
    'timestamp' => time(),
    'size' => strlen($data)
]));

// Setze Cache-Header
header('X-Cache: MISS');
header('X-Cache-Age: 0');

echo $data;
?>
