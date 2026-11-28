// Ouverture de la bouche image par image (repères de visage de Vision), pour contrôler la synchronisation des lèvres.
// usage : swift bouche.swift image1.png image2.png …   → une ligne par image : nom ; ouverture (hauteur des lèvres intérieures / hauteur du visage) ou -1 si pas de visage
import Foundation
import Vision
import AppKit

for chemin in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: chemin), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("\(chemin);-1"); continue }
    let req = VNDetectFaceLandmarksRequest()
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    // le plus grand visage de l'image
    guard let face = (req.results ?? []).max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }),
          let levres = face.landmarks?.innerLips else { print("\(chemin);-1"); continue }
    let ys = levres.normalizedPoints.map { $0.y }, xs = levres.normalizedPoints.map { $0.x }
    let h = (ys.max() ?? 0) - (ys.min() ?? 0), l = (xs.max() ?? 0) - (xs.min() ?? 0)
    print("\(chemin);\(String(format: "%.4f", h));\(String(format: "%.4f", l));\(String(format: "%.3f", face.boundingBox.height))")
}
