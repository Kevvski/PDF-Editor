<?php
    $fileName = "../uploads/" . $_POST["fileName"];

    if(file_exists($fileName)) {
        unlink($fileName);
    }
?>