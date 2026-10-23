# Gallery photo edits

Run 1 (ChatGPT): IMG_2664 and IMG_2991 → `enhanced/`, live on the site. Run 2 (Claude Code via Higgsfield): IMG_4120 and IMG_3665 → approved by the user, moved to `enhanced/`, live on the site; see the "Higgsfield run" section at the end.

Mode: built-in image_gen. User request: subtly enhance image quality and backgrounds to match the existing website; preserve each face and haircut. Originals are retained unchanged at the workspace root. PNG input conversions are in `source/`; selected full-resolution edits are in `enhanced/`; optimized gallery assets live in the app.

## Shared prompt

Use case: identity-preserve
Asset type: real client haircut photograph for the existing Skee Block barber website gallery.
Input image 1 is the edit target, not inspiration. Edit this exact photograph conservatively.
Primary request: change ONLY the distracting background and gently improve technical image quality. This is documentary barber portfolio work; the exact real haircut and face must remain faithful.
Background: replace clutter, bright ring lights, neon and wall objects with a softly graduated, understated matte charcoal studio wall (#131313 to #20201e), slightly warm neutral but no obvious colored lighting, no gold props. Preserve natural subject edge softness and individual edge hairs. The backdrop must match a dark black/bone/minimal gold editorial website.
Technical enhancement: light noise reduction and careful deblurring/sharpening for clearer natural details only. Keep authentic skin texture, pores, small marks and real hair strand structure. Do not retouch beauty, change features, smooth skin, invent detail, alter skin tone, or relight dramatically.
Framing: output a portrait 4:5 composition by extending plain background as needed, with the entire existing head, original full hair silhouette, face, ears, neckline and visible shoulders comfortably inside frame. Use the original camera angle and expression. Do not crop any hairstyle edges. Subject may be uniformly scaled for fit but must not be reshaped.
Strict invariants: same person, exact face geometry, nose, eyes, eyebrows, ears, jawline, facial hair, expression and pose; identical haircut silhouette, length, volume, parting, waves/curls, hairline and fade transition. Preserve original garments, their colors, seams and texture. Any visible hand stays anatomically and visually identical. No new people, text, logos, objects, stylization, glamour treatment, recoloring of clothes, or compositing of another face. The source subject must look like the same unchanged photo on a cleaner backdrop.

## Per-photo invariants

- IMG_4120: Preserve the front three-quarter face, long center-parted dark wavy curtain haircut, precise temple fade, red-and-black barber cape, and raised hand/arm at the right. Maintain the person's exact gaze, expression and all hair loops. Reduce the source's yellow cast only very lightly and naturally.
 - IMG_2664: Preserve the right-facing side profile, dark swept wavy haircut with long textured back and the exact taper around the ear, and black shirt/cape. The full back of the hair and nose must fit inside the frame.
 - IMG_2991: Preserve the left-facing side profile, tousled dark hair with warm highlights, exact taper/fade at the temple, long back and original natural short beard/stubble contours. Preserve every hair shape and full nose and rear silhouette.
 - IMG_3665: Preserve the right-facing side profile, dark curly textured haircut, exact taper around the ear and long curl pattern at the nape, natural sparse facial hair, and red barber cape. Keep the complete curly silhouette and full nose visible.

## Higgsfield run — 2026-10-22 (Claude Code)

Model: Higgsfield GPT Image 2.5 (`gpt_image_2_5`, variant flare), quality high, resolution 2k, aspect ratio 4:5 → 1792×2240 PNG. Input: the PNG in `source/` as the single image reference. Submitted through the Higgsfield MCP connector (the CLI refuses generation on this trial account).

Prompt = the shared prompt above (verbatim), then the per-photo invariants above, plus these additions.

Added to both:

Series consistency: this photo joins two already-edited gallery photos of the same website. Their backdrop is a plain, untextured matte charcoal wall about #141414 near the frame edges, rising very gradually to about #201F1E in a soft, wide glow behind the head, with no visible light sources, rings, spots or vignette bands, and a calm, natural, slightly low-key exposure. Match that backdrop and exposure so all four photos read as one studio series.

(The hex values were measured from `enhanced/IMG_2991-enhanced.png` and `enhanced/IMG_2664-enhanced.png`.)

Added for IMG_4120:

Remove from this photo: the wall sockets, switches and electrical box at the top, the bright ring light at the top right, the wooden broom handle leaning vertically behind the subject, and the small white specks on the wall. Keep the barber's hand and forearm touching the hair exactly as they are, entering from the right edge.

Added for IMG_3665:

Remove from this photo: the bright curved ring-light arc on the left, the blurred shop interior, shelves and objects, and the out-of-focus person in the background. Keep the red cape with its black ribbed collar unchanged.

Outputs (approved by the user on 2026-10-22 and live on the site):

- `enhanced/IMG_4120-enhanced.png` (generated as `review/IMG_4120-higgsfield.png`) — job `06d1aa37-e977-417f-9061-84eb181f06b2`
- `enhanced/IMG_3665-enhanced.png` (generated as `review/IMG_3665-higgsfield.png`) — job `b4852b1b-bf5d-4190-a051-e7d7b59c645f`
- Comparisons: `review/IMG_4120-before-after.jpg`, `review/IMG_3665-before-after.jpg`, `review/gallery-preview.jpg`
