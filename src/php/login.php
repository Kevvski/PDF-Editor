<?php
    $username = $_POST["username"];
    $password = $_POST["password"];
    $status = 0;
    $conn = new mysqli("SERVER", "USER_NAME", "PASSWORD", "DB_NAME"); 

    if(!$conn)
        $status = 2;
    else {
        $sql = "SELECT username, password FROM adminUsers";
        $result = $conn->query($sql);

        if($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                if($row["username"] == $username && $row["password"] == $password)
                    $status = 1;
                else
                    $status = 3;
            }
        }
    }

    $conn->close();
    echo $status;
?>