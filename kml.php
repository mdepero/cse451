<?PHP

header('Access-Control-Allow-Origin: *');  

$coords = json_decode(file_get_contents('php://input'));



// Include the AWS SDK using the Composer autoloader
require 'vendor/autoload.php';
use Aws\S3\S3Client;
//use Aws\Common\Aws;




try{










// Instantiate the client.
//the region is given to access the "nearest" server.  S3 data is not associated with region but access can be made faster this way
$s3=S3Client::factory(array('credentials'=>
        array('key'=>'AKIAI7DBDIIVDDF2QS5A','secret'=>'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'),
        'version'=>'2006-03-01','region'=>'us-east-1'));

//specifies which bucket to access
$bucket = 'deperomm-cse451';


$kml = '<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Your Route</name>
    <description>A route generated by Matt DePero\'s CSE451 Final Project</description>
    <Style id="green">
      <LineStyle>
        <color>7f00ff00</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>A route between two places</name>
      <description>A route for CSE451</description>
      <styleUrl>#green</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>';

$first = true;

foreach($coords as $coord){

if($first)
	$first = false;
else
$kml .= '
';

$kml .= $coord[1].','.$coord[0].',3000';

}


$kml .= '</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>';



$id = rand(1,9999);// randomly generated unique key for each kml file


// Upload an object to Amazon S3
$result = $s3->putObject(array(
    'Bucket' => $bucket,
    'Key'    => $id.'.kml',
    'ACL'    => 'public-read',
    'Body'   => $kml
));




echo '{"status":"success","downloadURL":"'.$result['ObjectURL'].'"}';




} catch (S3Exception $e) {
    // Catch an S3 specific exception.
    echo '{"status":"error","message":"'.$e->getMessage().'"}';
} catch (AwsException $e) {
    // This catches the more generic AwsException. You can grab information
    // from the exception using methods of the exception object.
    echo '{"status":"error","message":"'.$e->getMessage().'"}';
}



?>