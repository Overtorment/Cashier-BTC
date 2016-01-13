<?php

class Couchdb {
    
    /**
     * creates a new document in couchdb with a random ID and returns this ID
     * @param String $url
     * @param Array $data
     * @return String
     */
    public static function requestPost($url, $data) {                                                                   
        $data_string = json_encode($data);                                                                                   
 
        $ch = curl_init($url);                                             
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);                                                                  
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);                                                                 
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Accept: application/json',                                                                          
            'Content-Type: application/json',                                                                                
            'Content-Length: ' . strlen($data_string))                                                                       
        );                                                                                                                   
        
        $html = false; $try = 0;
        while (!$html && $try++ < 15) {
            curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 9 + $try*$try/2);
            $html = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($httpCode == 403 || $httpCode == 500) { /* we got banned ? */}
            if ($httpCode == 404)  return '';
            
            if (!$html) sleep($try*$try/2);
        }
        if ($html) {
            $arr = json_decode($html);
            return isset($arr->id) ? $arr->id : '';
        } else {
            return '';
        }
        
    }

    public static function request($url) {
        $html = false; $try = 0;
        $ch = curl_init();
        while (  !$html  && $try++ < 15  ) {
            curl_setopt ($ch, CURLOPT_URL,  $url );
            curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt ($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt ($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt ($ch, CURLOPT_SSLVERSION, 4);
            curl_setopt ($ch, CURLOPT_SSL_CIPHER_LIST, 'SSLv3');
            curl_setopt ($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; ru-RU; rv:1.7.12) Gecko/20050919 Firefox/1.0.7");
            curl_setopt ($ch, CURLOPT_POST, 0);
            curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 9 + $try*$try/8);
            $html = curl_exec($ch);

            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($httpCode == 403 || $httpCode == 500) { /* we got banned ? */}
            if ($httpCode == 404)  return false;
            

            if (!$html) {  // incrementally sleeping before next try
				trigger_error( "CURL error: ".  curl_error($ch)  );
                trigger_error("Incrementally sleeping before next try for url $url", E_USER_NOTICE );
                sleep($try/4);
            }
        }
        if (!$html)  { trigger_error('Curl response code: '.$httpCode.'; error no: '.curl_errno($ch).'; err msg: '.curl_error($ch). "for url $url", E_USER_NOTICE ); }
        curl_close($ch); unset($ch);
		return  json_decode($html, true);
    }
	
	/**
	 * @access public
	 * @param $url String
	 * @param $ids Array
	 * @return Array
	 */
	public static function getMany($url, $ids) {
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($curl, CURLOPT_POST, true);
		curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($ids));
		$out = curl_exec($curl);
		curl_close($curl);
		$out = json_decode($out, true);
		return $out;
	}

    public function __construct($couchdb){
        $this->couchdb = $couchdb;
    }

    public function save($key, $value, $retry = 0, $soft = false /* if true - do not force on rev conflict  */ ){
        $couchdb = $this->couchdb;
    	$tuCurl = curl_init();
    	curl_setopt($tuCurl, CURLOPT_URL, $url = (string)"{$couchdb}/{$key}");
        
    	curl_setopt($tuCurl, CURLOPT_CUSTOMREQUEST, "PUT");
    	curl_setopt($tuCurl, CURLOPT_HEADER, false);
    	curl_setopt($tuCurl, CURLOPT_RETURNTRANSFER, 1);
    	curl_setopt($tuCurl, CURLOPT_TIMEOUT,  1 + $retry*$retry  );  //  timeout  in seconds
    	curl_setopt($tuCurl, CURLOPT_POSTFIELDS, $data = json_encode(  $value  )  );
    	curl_setopt($tuCurl, CURLOPT_HTTPHEADER,  $headers = array('Content-Type: application/json'  ,  "Content-Length: ".strlen($data)       ));
            curl_setopt ($tuCurl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt ($tuCurl, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt ($tuCurl, CURLOPT_SSLVERSION, 4);
            curl_setopt($tuCurl, CURLOPT_SSL_CIPHER_LIST, 'SSLv3');

    	$tuData = curl_exec($tuCurl);

    	 if(!curl_errno($tuCurl)){ // curl  ok
            curl_close($tuCurl);
            unset($tuCurl);
    	 } else {  // curl failed
            if ($retry > 5) { // if number of retries exceeds limit, we print error message and abandon save job
                echo 'Curl error with {'.$url.'}   : ' . curl_error($tuCurl)."\n";
                curl_close($tuCurl);
                return false;
            } else { // retrying...
                curl_close($tuCurl);
                sleep(1 + $retry);
                return $this->save($key, $value, $retry+1, $soft);
            }
         }

    	$tuData = json_decode($tuData, true);

    	if (isset($tuData['ok'])  && $tuData['ok']){ /* ok! */ return true; }

    	if (isset($tuData['error'])   &&  $tuData['error'] == 'conflict') { // re-reading to get latest "_rev" (needed to overwrite the value). TODO: rewrite this on cached  _rev
            if ($soft) return false; // do not force on rev conflict

            $html = self::request("{$couchdb}/{$key}");
    		$value['_rev'] = $html['_rev'];
    		return $this->save(  $key,  $value  );
        }  elseif (isset($tuData['error']))  print ("Couchdb error : ".$tuData['error'].'. '.$tuData['reason']." with $url\n");
        return false;
    }


    public function delete($key, $rev = false,  $retry = 0){
        $couchdb = $this->couchdb;
    	$tuCurl = curl_init();
        if (!$rev) {
            $json =  self::request($couchdb."/".$key) ;
            $rev = $json['_rev'];
        }

    	curl_setopt($tuCurl, CURLOPT_URL, $url =  "{$couchdb}/{$key}?rev={$rev}");
    	curl_setopt($tuCurl, CURLOPT_CUSTOMREQUEST, "DELETE");
    	curl_setopt($tuCurl, CURLOPT_HEADER, false);
    	curl_setopt($tuCurl, CURLOPT_RETURNTRANSFER, 1);
    	curl_setopt($tuCurl, CURLOPT_TIMEOUT, 10);  //  timeout  in seconds
    	curl_setopt($tuCurl, CURLOPT_HTTPHEADER,  $headers = array('Content-Type: application/json'  ));

    	$tuData = curl_exec($tuCurl);
    	 if(!curl_errno($tuCurl)){ // curl  ok
    	 } else {  // curl failed
            if ($retry > 9) { // if number of retries exceeds limit, we print error message and abandon save job
                echo 'Curl error: ' . curl_error($tuCurl)."\n";
                curl_close($tuCurl);
                return false;
            } else {
                curl_close($tuCurl);
                sleep(1 + $retry);
                return $this->delete($key,  $rev,  $retry+1);
            }
         }
         curl_close($tuCurl);
         $tuData = json_decode($tuData, true);

    	 if (isset($tuData['ok']) && $tuData['ok']){ /* ok! */ return true; }
         else { print "Delete error: "; print_r($tuData); return false; }
    }
	
	public function bulk_update($docs, $retry = 0){
        $couchdb = $this->couchdb;
		$data = array();
		foreach ($docs as $doc)  array_push($data,  json_encode($doc));
		$data = '{"docs":['.implode(',', $data).']}';
    	$tuCurl = curl_init();
    	curl_setopt($tuCurl, CURLOPT_URL, $url = "{$couchdb}/_bulk_docs");
    	curl_setopt($tuCurl, CURLOPT_CUSTOMREQUEST, "POST");
    	curl_setopt($tuCurl, CURLOPT_HEADER, false);
    	curl_setopt($tuCurl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($tuCurl, CURLOPT_TIMEOUT,  30 + $retry*$retry/2  );  //  timeout  in seconds
    	curl_setopt($tuCurl, CURLOPT_POSTFIELDS, $data  );
    	curl_setopt($tuCurl, CURLOPT_HTTPHEADER,  $headers = array('Content-Type: application/json'  ,  "Content-Length: ".strlen($data)       ));
		curl_setopt($tuCurl, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($tuCurl, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($tuCurl, CURLOPT_SSLVERSION, 3);

    	$tuData = curl_exec($tuCurl);

    	 if(!curl_errno($tuCurl)){ // curl  ok
            curl_close($tuCurl);
            unset($tuCurl);
    	 } else {  // curl failed
            if ($retry > 20) { // if number of retries exceeds limit, we print error message and abandon save job
                echo __FILE__.', line '.__LINE__.'; curl error with '.$url.' : ' . curl_error($tuCurl)."\n";
                curl_close($tuCurl);
                return false;
            } else { // retrying...
                curl_close($tuCurl);
				unset($data); // to preserve some memory
                sleep(1 + $retry*$retry/2);
                return $this->bulk_update($docs,  $retry+1);
            }
         }

		return  json_decode($tuData, true);
	}

	public function bulk_fetch($ids, $retry = 0){
        $couchdb = $this->couchdb;
		$data = array('keys' =>  $ids);
		$data = json_encode($data);
    	$tuCurl = curl_init();
    	curl_setopt($tuCurl, CURLOPT_URL, $url = "{$couchdb}/_all_docs?include_docs=true");
    	curl_setopt($tuCurl, CURLOPT_CUSTOMREQUEST, "POST");
    	curl_setopt($tuCurl, CURLOPT_HEADER, false);
    	curl_setopt($tuCurl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($tuCurl, CURLOPT_TIMEOUT,  1 + $retry*$retry/2  );  //  timeout  in seconds
    	curl_setopt($tuCurl, CURLOPT_POSTFIELDS, $data  );
		//var_dump($data);
    	curl_setopt($tuCurl, CURLOPT_HTTPHEADER,  $headers = array('Content-Type: application/json'  ,  "Content-Length: ".strlen($data)       ));
		curl_setopt($tuCurl, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($tuCurl, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($tuCurl, CURLOPT_SSLVERSION, 3);

    	$tuData = curl_exec($tuCurl);

    	 if(!curl_errno($tuCurl)){ // curl  ok
            curl_close($tuCurl);
            unset($tuCurl);
    	 } else {  // curl failed
            if ($retry > 20) { // if number of retries exceeds limit, we print error message and abandon job
                echo __FILE__.', line '.__LINE__.'; curl error with '.$url.' : ' . curl_error($tuCurl)."\n";
                curl_close($tuCurl);
                return false;
            } else { // retrying...
                curl_close($tuCurl);
				unset($data); // to preserve some memory
                sleep(1 + $retry*$retry/2);
                return $this->bulk_fetch($ids,  $retry+1);
            }
         }

		return  json_decode($tuData, true);
	}

	public function truncate() {
		$couchdb = $this->couchdb;
		
		// get design docs from target db
		$ddocs = array(); 
		$options = array(
			CURLOPT_URL => (string)"{$couchdb}/_all_docs?startkey=\"_design/\"&endkey=\"_design0\"&include_docs=true",
			CURLOPT_CUSTOMREQUEST => "GET",
			CURLOPT_RETURNTRANSFER => 1,
			CURLOPT_HEADER => false,
			CURLOPT_TIMEOUT => 15,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_SSL_VERIFYHOST => false,
			CURLOPT_SSLVERSION => 3
		);		
		$curlInstance = curl_init();
		curl_setopt_array($curlInstance, $options);
		$tmp = json_decode(curl_exec($curlInstance))->rows;
		foreach($tmp as $t) {
			unset($t->doc->_rev);
			$ddocs[] = $t->doc;

		}	
		// TODO: save them safely  
		
		// delete target db
		curl_setopt_array($curlInstance, array( CURLOPT_CUSTOMREQUEST => "DELETE", CURLOPT_URL => (string)"{$couchdb}" ));
		curl_exec($curlInstance);
		// create empty target db
		curl_setopt_array($curlInstance, array( CURLOPT_CUSTOMREQUEST => "PUT", CURLOPT_URL => (string)"{$couchdb}"  ));
		curl_exec($curlInstance);
		curl_close($curlInstance);
		// push saved design docs to target db
		return $this->bulk_update($ddocs);
	}

}
