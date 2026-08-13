package com.grossimarche.integration.storage;

import com.grossimarche.config.StorageProperties;
import com.grossimarche.exception.BusinessException;
import com.grossimarche.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * Development storage: writes files under a local directory and returns a URL under the
 * configured public base. A generated UUID name defeats path-traversal and collisions;
 * only a safe extension is taken from the original filename.
 */
@Service
public class LocalStorageService implements StorageService {

    private final StorageProperties props;

    public LocalStorageService(StorageProperties props) {
        this.props = props;
    }

    @Override
    public String store(byte[] content, String contentType, String originalFilename) {
        String extension = extensionFor(contentType, originalFilename);
        String key = UUID.randomUUID().toString().replace("-", "") + extension;
        try {
            Path dir = Path.of(props.directory());
            Files.createDirectories(dir);
            Files.write(dir.resolve(key), content);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Échec de l'enregistrement du fichier.");
        }
        return props.publicBaseUrl().replaceAll("/$", "") + "/" + key;
    }

    private String extensionFor(String contentType, String originalFilename) {
        if (originalFilename != null) {
            int dot = originalFilename.lastIndexOf('.');
            if (dot >= 0 && dot < originalFilename.length() - 1) {
                String ext = originalFilename.substring(dot + 1).toLowerCase();
                if (ext.matches("[a-z0-9]{1,5}")) {
                    return "." + ext;
                }
            }
        }
        return switch (contentType == null ? "" : contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/avif" -> ".avif";
            default -> "";
        };
    }
}
