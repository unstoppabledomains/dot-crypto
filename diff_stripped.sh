#!/usr/bin/env sh

echo
echo 'ERC721.sol'
echo

diff contracts/registry/stripped_openzeppelin/ERC721.sol node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol

echo
echo 'ERC721Burnable.sol'
echo

diff contracts/registry/stripped_openzeppelin/ERC721Burnable.sol node_modules/@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol

echo
echo 'ERC165.sol'
echo

diff contracts/registry/stripped_openzeppelin/ERC165.sol node_modules/@openzeppelin/contracts/introspection/ERC165.sol
