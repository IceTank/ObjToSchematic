import { BasicBlockAssigner, OrderedDitheringBlockAssigner } from './block_assigner';
import { Voxel, VoxelMesh } from './voxel_mesh';
import { BlockAtlas, BlockInfo } from './block_atlas';
import { CustomError, LOG } from './util';
import { Renderer } from './renderer';
import { UI } from './ui/layout';

interface Block {
    voxel: Voxel;
    blockInfo: BlockInfo;
}

export class BlockMesh {
    private _blockPalette: string[];
    private _blocks: Block[];
    private _voxelMesh?: VoxelMesh;

    public constructor() {
        LOG('New block mesh');

        this._blockPalette = [];
        this._blocks = [];
    }
    
    public assignBlocks(voxelMesh: VoxelMesh) {
        LOG('Assigning blocks');
        
        const textureAtlas = UI.Get.layout.palette.elements.textureAtlas.getCachedValue() as string;
        BlockAtlas.Get.loadAtlas(textureAtlas);

        const blockPalette = UI.Get.layout.palette.elements.blockPalette.getCachedValue() as string;
        BlockAtlas.Get.loadPalette(blockPalette);

        const ditheringEnabled = UI.Get.layout.palette.elements.dithering.getCachedValue() as string === 'on';
        const blockAssigner = ditheringEnabled ? new OrderedDitheringBlockAssigner() : new BasicBlockAssigner();
        
        const voxels = voxelMesh.getVoxels();
        for (let voxelIndex = 0; voxelIndex < voxels.length; ++voxelIndex) {
            const voxel = voxels[voxelIndex];
            const block = blockAssigner.assignBlock(voxel.colour, voxel.position);

            this._blocks.push({
                voxel: voxel,
                blockInfo: block,
            });
            if (!this._blockPalette.includes(block.name)) {
                this._blockPalette.push(block.name);
            }
        }

        this._voxelMesh = voxelMesh;
    }

    public getBlocks(): Block[] {
        return this._blocks;
    }

    public getBlockPalette() {
        return this._blockPalette;
    }

    public getVoxelMesh() {
        if (!this._voxelMesh) {
            throw new CustomError('Could not get voxel mesh');
        }
        return this._voxelMesh;
    }

    public createBuffer() {
        const buffer = Renderer.Get._voxelBuffer.copy();

        const blockTexcoords: number[] = [];
        for (const block of this._blocks) {
            const faceOrder = ['north', 'south', 'up', 'down', 'east', 'west'];
            for (const face of faceOrder) {
                for (let i = 0; i < 4; ++i) {
                    const texcoord = block.blockInfo.faces[face].texcoord;
                    blockTexcoords.push(texcoord.u, texcoord.v);
                }
            }
        }
        buffer.attachNewAttribute({ name: 'blockTexcoord', numComponents: 2 }, blockTexcoords);
        buffer.removeAttribute('colour');

        return buffer;
    }
}
