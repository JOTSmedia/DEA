import Foundation
import Vision
import CoreImage
import ImageIO

let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard let source = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
      let sourceImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fatalError("Cannot read original photograph")
}
let handler = VNImageRequestHandler(cgImage: sourceImage, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else {
    fatalError("No foreground mask found")
}
let buffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: buffer)
let context = CIContext()
try context.writePNGRepresentation(of: mask, to: outputURL, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())
print("Saved foreground alpha mask: \(sourceImage.width) x \(sourceImage.height)")
