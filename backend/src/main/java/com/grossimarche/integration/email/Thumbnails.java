package com.grossimarche.integration.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/**
 * Shrinks pictures before they are carried inside an e-mail.
 *
 * A catalogue photo is often the better part of a megabyte. An announcement carries one per
 * product and goes to every customer of a trade, so sending them untouched would mean several
 * megabytes per copy - slow to send, and heavy in inboxes that still have quotas.
 *
 * Every method answers null rather than throwing when it cannot do the work: a format ImageIO
 * does not decode (WebP and AVIF, notably) is not a reason to drop the announcement, and the
 * caller falls back to the original bytes.
 */
final class Thumbnails {

    private static final Logger log = LoggerFactory.getLogger(Thumbnails.class);

    /** Above this, the original is carried as-is: re-encoding a small file only costs quality. */
    private static final int WORTH_SHRINKING_BYTES = 40_000;

    private Thumbnails() {
    }

    /**
     * A centred square, for the thumbnail beside a product's name.
     *
     * Cropped rather than squashed: an e-mail client cannot be told to cover a box the way CSS
     * would, so a non-square photo forced into a square cell comes out visibly stretched. The
     * crop is taken from the middle, where the subject of a product shot sits.
     */
    static byte[] square(byte[] source, int size) {
        BufferedImage image = decode(source);
        if (image == null) {
            return null;
        }
        int side = Math.min(image.getWidth(), image.getHeight());
        BufferedImage cropped = image.getSubimage(
                (image.getWidth() - side) / 2, (image.getHeight() - side) / 2, side, side);
        return encode(scale(cropped, size, size));
    }

    /** The picture kept whole, no wider than {@code maxWidth} - used for the offer's own photo. */
    static byte[] fit(byte[] source, int maxWidth) {
        if (source == null || source.length < WORTH_SHRINKING_BYTES) {
            return null;
        }
        BufferedImage image = decode(source);
        if (image == null || image.getWidth() <= maxWidth) {
            return null;
        }
        int height = Math.max(1, Math.round(image.getHeight() * (maxWidth / (float) image.getWidth())));
        return encode(scale(image, maxWidth, height));
    }

    private static BufferedImage decode(byte[] source) {
        if (source == null || source.length == 0) {
            return null;
        }
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(source));
            if (image == null) {
                // WebP, AVIF: no decoder in the JDK. The caller carries the original instead.
                log.debug("No ImageIO decoder for this picture; leaving it untouched.");
            }
            return image;
        } catch (Exception e) {
            log.debug("Picture could not be decoded; leaving it untouched.", e);
            return null;
        }
    }

    private static BufferedImage scale(BufferedImage source, int width, int height) {
        // TYPE_INT_RGB, not ARGB: the output is JPEG, which has no alpha, and a transparent PNG
        // drawn straight onto an alpha-less buffer comes out with a black background.
        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = target.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, width, height);
            g.drawImage(source, 0, 0, width, height, null);
        } finally {
            g.dispose();
        }
        return target;
    }

    private static byte[] encode(BufferedImage image) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "jpg", out)) {
                return null;
            }
            return out.toByteArray();
        } catch (Exception e) {
            log.debug("Thumbnail could not be encoded.", e);
            return null;
        }
    }
}
