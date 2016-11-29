<?php

/**
 * geoip class base on geoip.js(maptail)
 *
 * JasyDong
 */

$filename = '/var/wwwroot/geoip-api-php/data/geoip-city.dat';
$filename2 = '/var/wwwroot/geoip-api-php/data/geoip-city-names.dat';
$sz = filesize($filename);
$sz2 = filesize($filename2);
$fp = fopen($filename, 'rb');
$fp2 = fopen($filename2, 'rb');
$recsz = 12;
$lastline = $sz/$recsz-1;
$firstip = Util::readUInt32BE($fp);
$lastip = Util::readUInt32BE($fp, $lastline*$recsz+4);
echo '<pre>';
echo "{$filename} : {$sz} bytes<br>";
echo "{$filename2} : {$sz2} bytes<br>";

//test
$ip = Util::aton4('61.141.157.202');
$data = lookup4($ip);
print_r($data);


class Util {

    public static function readUInt32BE($fd, $offset=0) {
        fseek($fd, $offset);
        $bin = fread($fd, 4);

        if (PHP_INT_SIZE <= 4){
            list(,$h,$l) = unpack('n*', $bin);
            return ($l + ($h*0x010000));
        } else{
            list(,$int) = unpack('N', $bin);
            return $int;
        }
    }

    public static function readString($fd, $offset=0, $byte=2) {
        fseek($fd, $offset);
        $bin = fread($fd, $byte);

        return $bin;
    }

    public static function aton4($ip) {
        return ip2long($ip);
    }

}

function lookup4($ip) {
    global $recsz;
    global $firstip;
    global $lastip;
    global $lastline;
    global $fp;
    global $fp2;

    $private_ranges = array(
		array(Util::aton4("10.0.0.0"), Util::aton4("10.255.255.255")),
		array(Util::aton4("172.16.0.0"), Util::aton4("172.31.255.255")),
		array(Util::aton4("192.168.0.0"), Util::aton4("192.168.255.255"))
	);

    $lrecsz = 32;
	$fline=0;
    $cline=$lastline;
    $ceil=$firstip;
    $line=0;
    $locId=0;
    $cc=0;
    $rg=0;

	// outside IPv4 range
	if($ip > $lastip || $ip < $firstip) {
		return null;
	}

	// private IP
	for($i=0; $i<count($private_ranges); $i++) {
		if($ip >= $private_ranges[$i][0] && $ip <= $private_ranges[$i][1]) {
			return null;
		}
	}

	do {
		$line = round(($cline-$fline)/2)+$fline;
		$floor = Util::readUInt32BE($fp, $line*$recsz);
		$ceil  = Util::readUInt32BE($fp, $line*$recsz+4);

		if($floor <= $ip && $ceil >= $ip) {
			if($recsz == 10) {
				$cc = Util::readString($fp2, $line*$recsz+8);
				$rg = $city = "";
				$lat = $lon = 0;
			} else {
				$locId = Util::readUInt32BE($fp, $line*$recsz+8)-1;
                $cc = Util::readString($fp2, $locId*$lrecsz+0);
                $rg = Util::readString($fp2, $locId*$lrecsz+2);
				$lat = Util::readUInt32BE($fp2, $locId*$lrecsz+4)/10000;
				$lon = Util::readUInt32BE($fp2, $locId*$lrecsz+8)/10000;
				$city = Util::readString($fp2, $locId*$lrecsz+12, 20);
			}

			return array(
                "range"=>array($floor, $ceil),
				"country"=>$cc,
				"region"=>$rg,
				"city"=>$city,
				"ll"=>array($lat, $lon)
			);

		} else if($fline == $cline) {
			return null;
		} else if($fline == $cline-1) {
			if($line == $fline){
				$fline = $cline;
            } else {
				$cline = $fline;
            }
		} else if($floor > $ip) {
			$cline = $line;
		} else if($ceil < $ip) {
			$fline = $line;
		}

	} while(1);

}