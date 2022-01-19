<?php
    $file = "../uploads/" . basename($_FILES["file"]["name"]);
    $uploadOk = 1;

    if(move_uploaded_file($_FILES["file"]["tmp_name"], $file)) {
        $uploadOk = 1;
    }
    else {
        $uploadOk = 0;
    }

    echo $uploadOk;
?>