<?php
require('class.couchdb.php');
date_default_timezone_set('UTC');
set_time_limit(0);
ini_set('memory_limit', ' -1');


$config_lines = file(__DIR__.'/config.js');

foreach ($config_lines as $key => $line) {
	if (stripos($line, '"couchdb"') !== false){
		$couchdb = str_ireplace('"couchdb" :', '', $line);
		$couchdb = str_ireplace(',', '', $couchdb);
		$couchdb = str_ireplace('"', '', $couchdb);
		$couchdb = trim($couchdb);
	}
	if (stripos($line, '"base_url"') !== false){
		$base_url = str_ireplace('"base_url" :', '', $line);
		$base_url = str_ireplace(',', '', $base_url);
		$base_url = str_ireplace('"', '', $base_url);
		$base_url = trim($base_url);
	}
}









#############################################
#############################################
#############################################



$json = file_get_contents("{$couchdb}/_design/address/_view/processing_by_timestamp");
$json = json_decode($json, true);

foreach($json['rows'] as $row){
	$arrContextOptions=array(
	    "ssl"=>array(
	        "verify_peer"=>false,
	        "verify_peer_name"=>false,
	    ),
	);  

    $balance = file_get_contents("{$base_url}/get_address_confirmed_balance/{$row['id']}", false, stream_context_create($arrContextOptions));
    $document = file_get_contents("{$couchdb}/{$row['id']}", false, stream_context_create($arrContextOptions));
    $document = json_decode($document, true);
    unset($document['processing']);
    $document['processed'] = "unpaid";
    $couch = new Couchdb($couchdb);
    $couch->save($document['_id'], $document);
    print $row['id']."\t".((float)$balance).PHP_EOL;
}